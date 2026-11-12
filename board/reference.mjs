import { spaces } from "./kanto.mjs";

export const boardReference = Object.freeze({
  edition: 1999,
  status: "transcribed-local-board",
  source: "Jogo Original/Imagens/Mapa/Map_Kanto_Original_300dpi_pt.png",
  pending: Object.freeze(["Efeito original de Saffron City"]),
  spaces,
  landmarks: Object.freeze([
    ["Pallet Town", "Partida, no canto inferior esquerdo"],
    ["Cerulean City", "Centro Pokémon e bifurcação para Lavender ou Saffron"],
    ["Vermilion City", "Centro Pokémon"],
    ["Lavender Town", "Cidade mencionada na bifurcação"],
    ["Saffron City", "Cidade mencionada na bifurcação"],
    ["Fuchsia City", "Cidade mencionada no exemplo de movimento"],
    ["Cinnabar Island", "Duas cartas de item e acesso ao Indigo Plateau"],
    ["Indigo Plateau", "Circuito hexagonal em sentido horário"],
    ["Unknown Dungeon", "Reserva de quatro fichas amarelas, no canto inferior direito"]
  ].map(Object.freeze))
});
