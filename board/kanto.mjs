import { createBoard } from "./graph.mjs";

// Coordenadas medidas em uma cópia de inspeção 1800 × 1200 da arte fornecida.
// Para captura, o segundo par marca o centro do encaixe da ficha.
const raw = new Map();
const chipCenters = {};
const percent = (x, y) => ({ x: 100 * x / 1800, y: 100 * y / 1200 });
function space(id, kind, x, y, actions, color = null, landmark = null) {
  raw.set(id, { id, kind, ...percent(x, y), actions, color, landmark, edges: [] });
  return id;
}
const city = (id, x, y, action, landmark) =>
  space(id, action === "revive" ? "center" : "city", x, y, action ? [action] : [], null, landmark);
const event = (id, color, x, y) => space(id, "event", x, y, ["draw-event"], color);
function capture(id, color, x, y, chipX, chipY) {
  chipCenters[id] = Object.freeze(percent(chipX, chipY));
  return space(id, "catch", x, y, ["capture"], color);
}
function connect(ids, reverseRule = "road") {
  for (let i = 1; i < ids.length; i++) {
    const [a, b] = [raw.get(ids[i - 1]), raw.get(ids[i])];
    a.edges.push({ to: b.id, rule: "road" });
    b.edges.push({ to: a.id, rule: reverseRule });
  }
}

export const startSpace = city("pallet", 346, 913, null, "pallet");
city("viridian", 283, 635, "draw-item-2");
city("pewter", 346, 237, "draw-item-2");
city("cerulean", 1010, 177, "revive", "cerulean");
city("lavender", 1472, 388, "draw-item-2");
city("saffron", 1018, 407, "verify-saffron");
city("celadon", 676, 399, "draw-item-2");
city("vermilion", 1018, 644, "revive");
city("fuchsia", 870, 999, "draw-item-2");
city("cinnabar", 488, 1036, "draw-item-2", "cinnabar");

connect(["pallet",
  capture("p1", "pink", 259, 822, 184, 819), event("pe1", "pink", 252, 738),
  capture("p2", "pink", 174, 696, 105, 712), "viridian", event("pe2", "pink", 261, 541),
  capture("p3", "pink", 206, 474, 134, 502), capture("p4", "pink", 274, 435, 326, 378),
  event("pe3", "pink", 221, 378), capture("p5", "pink", 149, 348, 79, 372),
  capture("p6", "pink", 140, 268, 71, 256), capture("p7", "pink", 219, 247, 201, 174),
  "pewter", event("pe4", "pink", 310, 148), capture("p8", "pink", 344, 75, 276, 48),
  event("pe5", "pink", 406, 123), capture("p9", "pink", 485, 120, 490, 46),
  capture("p10", "pink", 517, 196, 492, 269), capture("g1", "green", 634, 189, 654, 262),
  event("ge1", "green", 666, 114), capture("g2", "green", 747, 120, 753, 47),
  capture("g3", "green", 830, 117, 878, 57), event("ge2", "green", 882, 182),
  "cerulean"], "after-cerulean");

connect(["cerulean", capture("g4", "green", 1149, 128, 1126, 54), event("ge3", "green", 1268, 155),
  capture("g5", "green", 1347, 153, 1334, 80), capture("g6", "green", 1420, 193, 1419, 270),
  event("ge4", "green", 1505, 216), capture("g7", "green", 1580, 243, 1651, 224),
  event("ge5", "green", 1592, 322), "lavender"]);
connect(["cerulean", event("ge6", "green", 1047, 276), capture("g8", "green", 962, 277, 883, 283), "saffron"]);
connect(["saffron", event("ge7", "green", 1147, 400), capture("g9", "green", 1269, 400, 1283, 322),
  event("ge8", "green", 1352, 402), "lavender"]);
connect(["saffron", capture("g10", "green", 891, 393, 873, 468),
  event("ge9", "green", 805, 368), "celadon"]);
connect(["saffron", event("be1", "blue", 973, 502),
  capture("b1", "blue", 1047, 541, 1128, 533), "vermilion"]);

event("be-junction-west", "blue", 1146, 638);
event("be-junction-east", "blue", 1429, 639);
capture("b-junction", "blue", 1534, 670, 1611, 677);
connect(["vermilion", "be-junction-west"]);
connect(["be-junction-west", event("be2", "blue", 1272, 574),
  capture("b2", "blue", 1354, 576, 1379, 501), "be-junction-east"]);
connect(["be-junction-west", capture("b3", "blue", 1270, 706, 1291, 782),
  event("be3", "blue", 1355, 701), "be-junction-east"]);
connect(["be-junction-east", "b-junction"]);
connect(["lavender", capture("b4", "blue", 1519, 506, 1591, 500),
  event("be4", "blue", 1529, 586), "b-junction"]);
connect(["b-junction", capture("b5", "blue", 1507, 761, 1567, 806),
  event("be5", "blue", 1426, 780), capture("b6", "blue", 1362, 858, 1432, 884),
  capture("b7", "blue", 1336, 941, 1368, 1005), event("be6", "blue", 1265, 984),
  capture("b8", "blue", 1145, 982, 1127, 905), capture("b9", "blue", 1071, 1025, 1118, 1088),
  event("be7", "blue", 991, 1003), "fuchsia"]);

connect(["celadon", capture("r1", "red", 512, 441, 461, 385),
  capture("r2", "red", 512, 531, 436, 510), capture("r3", "red", 512, 619, 436, 635),
  event("re1", "red", 512, 705), capture("r4", "red", 512, 792, 436, 800),
  event("re2", "red", 512, 880), capture("r5", "red", 636, 952, 657, 1027),
  event("re3", "red", 751, 985), "fuchsia"]);
connect(["fuchsia", capture("r6", "red", 896, 1118, 967, 1159),
  capture("r7", "red", 811, 1156, 764, 1096), event("re4", "red", 638, 1163),
  event("re5", "red", 512, 1160), event("re6", "red", 432, 1141), "cinnabar"]);

const clockwise = [
  [633, 751, null], [642, 678, "draw-item-1"], [652, 617, "draw-event"],
  [690, 580, "draw-item-3"], [745, 580, "final"], [800, 582, "draw-event"],
  [839, 622, "draw-item-2"], [852, 677, "catch-red"], [851, 749, "draw-event"],
  [836, 812, "catch-blue"], [799, 853, "draw-event"], [746, 854, "final"],
  [690, 852, "catch-green"], [651, 810, "draw-item-2"]
].map(([x,y,action], i) => space(i ? "indigo-" + i : "indigo-arrival", "plateau", x, y, action ? [action] : []));
raw.get("cinnabar").edges.push({ to: clockwise[0], rule: "enter-plateau" });
clockwise.forEach((id, i) => raw.get(id).edges.push({ to: clockwise[(i + 1) % clockwise.length], rule: "clockwise" }));

export const kantoBoard = createBoard([...raw.values()]);
export const spaces = kantoBoard.spaces;
// A área impressa é contínua. As quatro posições apenas organizam as fichas na tela.
[[1530,1001],[1687,1001],[1530,1112],[1687,1112]].forEach(([x,y], i) => {
  chipCenters["dungeon-" + (i + 1)] = Object.freeze(percent(x,y));
});
export const chipPositions = Object.freeze(chipCenters);
