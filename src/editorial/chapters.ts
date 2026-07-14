export interface EditorialChapter {
  id: string;
  number: string;
  label: string;
  heading: string;
  body: string;
  diagnostic: string;
  alignment: "left" | "right";
}

export const EDITORIAL_CHAPTERS: readonly EditorialChapter[] = [
  {
    id: "sem-sinal",
    number: "00",
    label: "Sem sinal",
    heading: "Antes da imagem, existe tensão.",
    body: "O escuro nunca foi vazio. Sob o vidro frio, elétrons aguardam uma ordem que a máquina ainda se lembra de cumprir.",
    diagnostic: "VOLTAGE 0.17 · SYNC —",
    alignment: "left",
  },
  {
    id: "aquecimento",
    number: "01",
    label: "Aquecimento",
    heading: "A luz precisa aquecer.",
    body: "Primeiro uma linha. Depois o campo inteiro. O brilho não aparece: ele conquista o fósforo, ponto por ponto.",
    diagnostic: "CATHODE READY · 15.7 kHz",
    alignment: "right",
  },
  {
    id: "varredura",
    number: "02",
    label: "Varredura",
    heading: "Cada linha carrega um instante.",
    body: "A imagem antiga nunca existiu inteira. Era reescrita centenas de vezes, rápido o bastante para parecer permanência.",
    diagnostic: "RASTER LOCK · PHOSPHOR P31",
    alignment: "left",
  },
  {
    id: "memoria-alta",
    number: "03",
    label: "Memória alta",
    heading: "A máquina conta antes de falar.",
    body: "Endereços, testes, páginas de memória. A primeira linguagem do sistema não seduz: verifica se ainda consegue existir.",
    diagnostic: "640K OK · BANK 03 ACTIVE",
    alignment: "right",
  },
  {
    id: "prompt",
    number: "04",
    label: "Prompt",
    heading: "Um cursor é uma pergunta acesa.",
    body: "O vazio depois do sinal não é silêncio. É espaço para uma instrução — e para o vestígio de quem a escreveu.",
    diagnostic: "C:\\MEMORY> _",
    alignment: "left",
  },
  {
    id: "barramento",
    number: "05",
    label: "Barramento",
    heading: "Toda memória encontra um caminho.",
    body: "Sob teclas e carcaças, trilhas de cobre sincronizam impulsos. A máquina se torna viva quando tudo começa a chegar junto.",
    diagnostic: "BUS 8 MHz · IRQ 05",
    alignment: "right",
  },
  {
    id: "persistencia",
    number: "06",
    label: "Persistência",
    heading: "O que permanece não é a imagem. É o brilho.",
    body: "Mesmo depois do comando, o fósforo demora a esquecer. Por um breve instante, passado e presente ocupam o mesmo vidro.",
    diagnostic: "GHOST FRAME · SYSTEM ALIVE",
    alignment: "left",
  },
] as const;
