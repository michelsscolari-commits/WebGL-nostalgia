import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const playwrightModuleUrl = process.env.PLAYWRIGHT_MODULE_URL;
const chromePath = process.env.CHROME_PATH;
const axePath = process.env.AXE_PATH;

if (!playwrightModuleUrl || !chromePath || !axePath) {
  throw new Error(
    "Defina PLAYWRIGHT_MODULE_URL, CHROME_PATH e AXE_PATH para executar a auditoria visual.",
  );
}

const { chromium } = await import(playwrightModuleUrl);
const outputDirectory = path.resolve("output/playwright");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: [
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
    "--disable-gpu-sandbox",
  ],
});

function digest(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function readCanvasFingerprint(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const gl = canvas?.getContext("webgl2") ?? canvas?.getContext("webgl");
    if (!canvas || !gl) return null;

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    gl.finish();
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let hashA = 0x811c9dc5;
    let hashB = 0x9e3779b9;
    let nonZero = 0;
    let clippedPixels = 0;
    for (let index = 0; index < pixels.length; index += 1) {
      const value = pixels[index];
      hashA = Math.imul(hashA ^ value, 0x01000193) >>> 0;
      hashB = Math.imul(hashB + value + index, 0x85ebca6b) >>> 0;
      if (value !== 0) nonZero += 1;
    }

    for (let index = 0; index < pixels.length; index += 4) {
      if (
        pixels[index] >= 250 ||
        pixels[index + 1] >= 250 ||
        pixels[index + 2] >= 250
      ) {
        clippedPixels += 1;
      }
    }

    return {
      width,
      height,
      hashA,
      hashB,
      nonZero,
      clippedRatio: clippedPixels / (width * height),
    };
  });
}

async function waitForProgress(page, progress) {
  await page.evaluate((value) => {
    if (value <= 0) {
      window.scrollTo(0, 0);
      return;
    }

    const chapters = Array.from(document.querySelectorAll(".chapter"));
    const anchors = chapters.map(
      (chapter) =>
        chapter.offsetTop + chapter.offsetHeight / 2 - window.innerHeight / 2,
    );
    const phase = value * (anchors.length - 1);
    const from = Math.min(anchors.length - 1, Math.floor(phase));
    const to = Math.min(anchors.length - 1, from + 1);
    const local = phase - from;
    const target = anchors[from] + (anchors[to] - anchors[from]) * local;
    window.scrollTo(0, target);
  }, progress);

  await page.waitForFunction(
    (value) => {
      const current = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--visual-progress",
        ),
      );
      return Number.isFinite(current) && Math.abs(current - value) < 0.009;
    },
    progress,
    { timeout: 8_000 },
  );
}

async function collectPageFacts(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const webgl =
      canvas?.getContext("webgl2") ?? canvas?.getContext("webgl") ?? null;
    const visualLayer = document.querySelector(".visual-layer");
    return {
      title: document.title,
      headingCount: document.querySelectorAll("[data-editorial-heading]").length,
      canvasCount: document.querySelectorAll("canvas").length,
      webgl: Boolean(webgl),
      webglReady: visualLayer?.getAttribute("data-webgl-ready"),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  });
}

const results = {
  generatedAt: new Date().toISOString(),
  desktop: {},
  reducedMotion: {},
  tablet: {},
  mobile: {},
  fallback: {},
};

try {
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  const desktopPage = await desktopContext.newPage();
  const consoleErrors = [];
  desktopPage.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  desktopPage.on("pageerror", (error) => consoleErrors.push(error.message));

  await desktopPage.goto("http://localhost:4173", { waitUntil: "networkidle" });
  await desktopPage.waitForFunction(
    () => document.querySelector(".visual-layer")?.getAttribute("data-webgl-ready") === "true",
    undefined,
    { timeout: 10_000 },
  );

  await desktopPage.addScriptTag({ path: axePath });
  const accessibility = await desktopPage.evaluate(async () => {
    const report = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: [
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
          "wcag22a",
          "wcag22aa",
        ],
      },
    });
    return report.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      targets: violation.nodes.flatMap((node) => node.target),
    }));
  });
  await desktopPage.keyboard.press("Tab");
  const keyboardFirstFocus = await desktopPage.evaluate(() => ({
    className: document.activeElement?.className,
    text: document.activeElement?.textContent?.trim(),
  }));
  await desktopPage.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
  const motionControlSize = await desktopPage
    .locator(".motion-control")
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

  await desktopPage.waitForTimeout(420);
  await desktopPage.screenshot({
    path: path.join(outputDirectory, "desktop-boot-line.png"),
  });
  await desktopPage.waitForTimeout(2_650);
  await desktopPage.screenshot({
    path: path.join(outputDirectory, "desktop-boot-open.png"),
  });
  try {
    await desktopPage.waitForFunction(
      () => document.querySelector(".boot-overlay")?.getAttribute("data-state") === "complete",
      undefined,
      { timeout: 10_000 },
    );
  } catch (error) {
    const bootDiagnostics = await desktopPage.evaluate(() => ({
      state: document.querySelector(".boot-overlay")?.getAttribute("data-state"),
      visibility: document.visibilityState,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      bootProgress: getComputedStyle(document.documentElement).getPropertyValue(
        "--boot-progress",
      ),
      visualProgress: getComputedStyle(document.documentElement).getPropertyValue(
        "--visual-progress",
      ),
    }));
    throw new Error(
      `Boot não concluiu: ${JSON.stringify({ bootDiagnostics, consoleErrors })}`,
      { cause: error },
    );
  }

  const checkpoints = [0, 0.18, 0.36, 0.54, 0.72, 0.9, 1];
  for (const checkpoint of checkpoints) {
    await waitForProgress(desktopPage, checkpoint);
    await desktopPage.screenshot({
      path: path.join(
        outputDirectory,
        `desktop-${String(Math.round(checkpoint * 100)).padStart(3, "0")}.png`,
      ),
    });
  }

  await waitForProgress(desktopPage, 0.72);
  const desktopCanvas = desktopPage.locator("canvas");
  const movingFingerprintA = await readCanvasFingerprint(desktopPage);
  await desktopCanvas.screenshot({
    path: path.join(outputDirectory, "canvas-moving-a.png"),
  });
  await desktopPage.waitForTimeout(750);
  const movingFingerprintB = await readCanvasFingerprint(desktopPage);
  await desktopCanvas.screenshot({
    path: path.join(outputDirectory, "canvas-moving-b.png"),
  });

  await desktopPage.locator(".motion-control").click();
  await desktopPage.waitForTimeout(180);
  const pausedVisualTimeA = await desktopPage.evaluate(() =>
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--visual-time"),
    ),
  );
  const pausedFingerprintA = await readCanvasFingerprint(desktopPage);
  const pausedA = await desktopCanvas.screenshot({
    path: path.join(outputDirectory, "canvas-paused-a.png"),
  });
  await desktopPage.mouse.move(120, 180);
  await desktopPage.waitForTimeout(750);
  const pausedVisualTimeB = await desktopPage.evaluate(() =>
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--visual-time"),
    ),
  );
  const pausedFingerprintB = await readCanvasFingerprint(desktopPage);
  const pausedB = await desktopCanvas.screenshot({
    path: path.join(outputDirectory, "canvas-paused-b.png"),
  });
  await desktopPage.locator(".motion-control").click();
  await desktopPage.waitForTimeout(260);
  const resumedVisualTime = await desktopPage.evaluate(() =>
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--visual-time"),
    ),
  );
  const resumedFingerprint = await readCanvasFingerprint(desktopPage);
  await desktopPage.evaluate(() => {
    document
      .querySelector("canvas")
      ?.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await desktopPage.waitForFunction(
    () =>
      document
        .querySelector(".experience-shell")
        ?.getAttribute("data-webgl-available") === "false",
  );
  await desktopPage.waitForTimeout(300);
  const contextLostFallback = await desktopPage.evaluate(() => ({
    visualCanvasOpacity: getComputedStyle(
      document.querySelector(".visual-canvas"),
    ).opacity,
    status: document.querySelector(".system-status")?.textContent?.trim(),
  }));
  await desktopPage.evaluate(() => {
    document
      .querySelector("canvas")
      ?.dispatchEvent(new Event("webglcontextrestored"));
  });
  await desktopPage.waitForFunction(
    () =>
      document
        .querySelector(".experience-shell")
        ?.getAttribute("data-webgl-available") === "true" &&
      document
        .querySelector(".visual-layer")
        ?.getAttribute("data-webgl-ready") === "true",
  );
  const contextRestored = await desktopPage.evaluate(() => ({
    available: document
      .querySelector(".experience-shell")
      ?.getAttribute("data-webgl-available"),
    ready: document
      .querySelector(".visual-layer")
      ?.getAttribute("data-webgl-ready"),
  }));

  results.desktop = {
    ...(await collectPageFacts(desktopPage)),
    consoleErrors,
    accessibility,
    keyboardFirstFocus,
    motionControlSize,
    normalFramesDiffer:
      JSON.stringify(movingFingerprintA) !== JSON.stringify(movingFingerprintB),
    pausedFramesIdentical:
      JSON.stringify(pausedFingerprintA) === JSON.stringify(pausedFingerprintB),
    pausedVisualTimeStable: pausedVisualTimeA === pausedVisualTimeB,
    resumedWithoutClockJump:
      resumedVisualTime > pausedVisualTimeB &&
      resumedVisualTime - pausedVisualTimeB < 0.65,
    contextLostFallback,
    contextRestored,
    movingFingerprintA,
    movingFingerprintB,
    pausedFingerprintA,
    pausedFingerprintB,
    resumedFingerprint,
    pausedVisualTimeA,
    pausedVisualTimeB,
    resumedVisualTime,
    pausedHashA: digest(pausedA),
    pausedHashB: digest(pausedB),
  };
  await desktopContext.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  const reducedErrors = [];
  reducedPage.on("console", (message) => {
    if (message.type() === "error") reducedErrors.push(message.text());
  });
  reducedPage.on("pageerror", (error) => reducedErrors.push(error.message));
  await reducedPage.goto("http://localhost:4173", { waitUntil: "networkidle" });
  await reducedPage.waitForFunction(
    () => document.querySelector(".visual-layer")?.getAttribute("data-webgl-ready") === "true",
    undefined,
    { timeout: 10_000 },
  );
  await waitForProgress(reducedPage, 0.54);
  await reducedPage.mouse.move(180, 400);
  await reducedPage.waitForTimeout(220);
  const pointerFingerprintLeft = await readCanvasFingerprint(reducedPage);
  const reducedCanvas = reducedPage.locator("canvas");
  const pointerLeft = await reducedCanvas.screenshot({
    path: path.join(outputDirectory, "reduced-pointer-left.png"),
  });
  await reducedPage.mouse.move(1_100, 400);
  await reducedPage.waitForTimeout(220);
  const pointerFingerprintRight = await readCanvasFingerprint(reducedPage);
  const pointerRight = await reducedCanvas.screenshot({
    path: path.join(outputDirectory, "reduced-pointer-right.png"),
  });
  results.reducedMotion = {
    ...(await collectPageFacts(reducedPage)),
    consoleErrors: reducedErrors,
    pointerFramesDiffer:
      JSON.stringify(pointerFingerprintLeft) !==
      JSON.stringify(pointerFingerprintRight),
    pointerFingerprintLeft,
    pointerFingerprintRight,
    pointerHashLeft: digest(pointerLeft),
    pointerHashRight: digest(pointerRight),
  };
  await reducedContext.close();

  const tabletContext = await browser.newContext({
    viewport: { width: 820, height: 1180 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    isMobile: true,
    hasTouch: true,
  });
  const tabletPage = await tabletContext.newPage();
  const tabletErrors = [];
  tabletPage.on("console", (message) => {
    if (message.type() === "error") tabletErrors.push(message.text());
  });
  tabletPage.on("pageerror", (error) => tabletErrors.push(error.message));
  await tabletPage.goto("http://localhost:4173", { waitUntil: "networkidle" });
  await tabletPage.waitForFunction(
    () => document.querySelector(".visual-layer")?.getAttribute("data-webgl-ready") === "true",
    undefined,
    { timeout: 10_000 },
  );
  await waitForProgress(tabletPage, 0.54);
  await tabletPage.screenshot({
    path: path.join(outputDirectory, "tablet-054.png"),
  });
  results.tablet = {
    ...(await collectPageFacts(tabletPage)),
    consoleErrors: tabletErrors,
  };
  await tabletContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  const mobileErrors = [];
  mobilePage.on("console", (message) => {
    if (message.type() === "error") mobileErrors.push(message.text());
  });
  mobilePage.on("pageerror", (error) => mobileErrors.push(error.message));
  await mobilePage.goto("http://localhost:4173", { waitUntil: "networkidle" });
  await mobilePage.waitForFunction(
    () => document.querySelector(".visual-layer")?.getAttribute("data-webgl-ready") === "true",
    undefined,
    { timeout: 10_000 },
  );
  await mobilePage.waitForFunction(
    () => document.querySelector(".boot-overlay")?.getAttribute("data-state") === "complete",
    undefined,
    { timeout: 8_000 },
  );
  await waitForProgress(mobilePage, 0.54);
  await mobilePage.screenshot({
    path: path.join(outputDirectory, "mobile-054.png"),
  });
  await waitForProgress(mobilePage, 1);
  await mobilePage.screenshot({
    path: path.join(outputDirectory, "mobile-100.png"),
  });
  results.mobile = {
    ...(await collectPageFacts(mobilePage)),
    consoleErrors: mobileErrors,
  };
  await mobileContext.close();

  const fallbackContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  await fallbackContext.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
      if (type === "webgl" || type === "webgl2") return null;
      return originalGetContext.call(this, type, ...args);
    };
  });
  const fallbackPage = await fallbackContext.newPage();
  const fallbackErrors = [];
  fallbackPage.on("console", (message) => {
    if (message.type() === "error") fallbackErrors.push(message.text());
  });
  fallbackPage.on("pageerror", (error) => fallbackErrors.push(error.message));
  await fallbackPage.goto("http://localhost:4173", { waitUntil: "networkidle" });
  await fallbackPage.waitForFunction(
    () => document.querySelector(".experience-shell")?.getAttribute("data-webgl-available") === "false",
    undefined,
    { timeout: 5_000 },
  );
  await fallbackPage.screenshot({
    path: path.join(outputDirectory, "fallback-static.png"),
  });
  results.fallback = {
    ...(await collectPageFacts(fallbackPage)),
    consoleErrors: fallbackErrors,
    status: await fallbackPage.locator(".system-status").textContent(),
    fallbackVisible: await fallbackPage.locator(".fallback-field").isVisible(),
  };
  await fallbackContext.close();
} finally {
  await browser.close();
}

await writeFile(
  path.join(outputDirectory, "audit-results.json"),
  `${JSON.stringify(results, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify(results, null, 2));
