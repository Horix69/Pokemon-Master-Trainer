import { test } from "node:test";
import assert from "node:assert/strict";
import { createBoard, getLegalRoutes, isLegalRoute, resolveRoute } from "../board/graph.mjs";
import { boardReference } from "../board/reference.mjs";
import { kantoBoard, spaces, chipPositions } from "../board/kanto.mjs";

// Micrografo sintético, somente para testes de transições; não é a topologia de 1999.
const e = (to, rule = "road") => ({ to, rule });
const s = (id, edges, landmark = null, kind = "city") => ({ id, edges, landmark, kind, x: 0, y: 0, actions: [] });
const road = createBoard([
  s("a", [e("b")], "pallet"),
  s("b", [e("a", "after-cerulean"), e("c")]),
  s("c", [e("b", "after-cerulean"), e("d"), e("z")], "cerulean", "center"),
  s("d", [e("c"), e("f")]), s("z", [e("c"), e("f")]),
  s("f", [e("d"), e("z"), e("g")], "cinnabar"), s("g", [e("f")])
]);
const moves = (roll, options = {}) => getLegalRoutes(road, { roll, start: "a", playerId: "human", ...options });

test("tabuleiro fornecido: 90 casas e 37 encaixes, distribuídos por cor", () => {
  assert.equal(boardReference.spaces, spaces);
  assert.equal(spaces.length, 90);
  assert.equal(Object.keys(chipPositions).length, 41);
  for (let i = 1; i <= 4; i++) {
    assert.ok(chipPositions["dungeon-" + i]);
    assert.equal(kantoBoard.get("dungeon-" + i), undefined);
  }
  for (const [color,count] of Object.entries({pink:10,green:10,blue:10,red:7})) {
    assert.equal(spaces.filter(s => s.kind === "catch" && s.color === color).length,count);
  }
  for (const s of spaces) {
    assert.ok(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100);
    assert.equal(Boolean(chipPositions[s.id]), s.kind === "catch");
  }
  assert.equal(spaces.filter(s => s.kind === "plateau").length, 14);
  assert.equal(spaces.filter(s => s.actions.includes("final")).length, 2);
  assert.equal(spaces.filter(s => s.kind === "event").length, 29);
  assert.equal(kantoBoard.get("saffron").actions[0], "verify-saffron");
});
test("grafo recusa dados inválidos antes do primeiro turno", () => {
  assert.throws(() => createBoard([s("a", [e("missing")])]));
  assert.throws(() => createBoard([s("a", []), s("a", [])]));
  assert.throws(() => createBoard([s("a", [e("b", "unknown")]), s("b", [])]));
  assert.throws(() => createBoard([s("a", []), s("p", [e("a")], null, "plateau")]));
});
test("dado d6, cidades contadas, direção inicial e bifurcação", () => {
  for (const bad of [0, 7, 1.5, NaN]) assert.throws(() => moves(bad));
  assert.deepEqual(moves(1, { start: "b" }).map(r => r.destination), ["c"]);
  assert.deepEqual(moves(1, { start: "b", passedCerulean: true }).map(r => r.destination), ["a", "c"]);
  assert.deepEqual(moves(3).map(r => r.destination), ["d", "z"]);
  assert.ok(moves(3).every(r => r.passedCerulean));
});
test("sem retornos na estrada e sem atalhos enviados pela interface", () => {
  assert.ok(moves(6).every(r => new Set(r.path).size === r.path.length));
  assert.equal(isLegalRoute(road, { start: "c", roll: 2 }, ["c", "d", "c"]), false);
  assert.equal(resolveRoute(road, { start: "a", roll: 1 }, ["a", "f"]), null);
});
test("ocupação desloca o destino e preserva o caminho para retomar após recusa", () => {
  const routes = moves(1, { occupants: { b: ["one"], c: ["two", "three"] } });
  assert.deepEqual(routes.map(r => r.destination), ["d", "z"]);
  for (const r of routes) {
    assert.deepEqual(r.meetings, [{ step: 1, space: "b", playerId: "one" }]);
    assert.equal(r.extended, true);
  }
});
test("Cinnabar permite parada antecipada opcional e ocupação compartilhada", () => {
  const routes = moves(2, { start: "d", occupants: { f: ["one", "two"] } });
  assert.ok(routes.some(r => r.destination === "f" && !r.exact));
  assert.ok(routes.some(r => r.destination === "g" && r.exact));
  assert.ok(routes.every(r => !r.meetings.length));
});

const ring = createBoard([
  s("before", [e("island")]),
  s("island", [e("before"), e("0", "enter-plateau")], "cinnabar"),
  ...Array.from({ length: 6 }, (_, i) => s(String(i), [e(String((i + 1) % 6), "clockwise")], null, "plateau"))
]);
test("entrada exige começar o movimento em Cinnabar e possuir 20 pontos", () => {
  const routes = (start, power) => getLegalRoutes(ring, { start, power, roll: 2 });
  assert.ok(!routes("island", 19).some(r => r.path.includes("0")));
  assert.ok(!routes("before", 20).some(r => r.path.includes("0")));
  assert.ok(routes("island", 20).some(r => r.destination === "2"));
});
test("no circuito horário uma volta inteira é possível e o peão ativo não bloqueia sua própria casa", () => {
  const [route] = getLegalRoutes(ring, { start: "0", roll: 6, playerId: "me", occupants: { 0: ["me"] } });
  assert.deepEqual(route.path, ["0", "1", "2", "3", "4", "5", "0"]);
  assert.equal(route.exact, true);
});
test("salto por ocupação no platô preserva a distinção entre parada e contagem exata", () => {
  const [route] = getLegalRoutes(ring, { start: "0", roll: 1, occupants: { 1: ["other"] } });
  assert.equal(route.destination, "2");
  assert.equal(route.exact, false);
});
test("integridade das ligações e acessibilidade a partir de Pallet", () => {
  const reached = new Set(["pallet"]);
  for (const id of reached) for (const edge of kantoBoard.get(id).edges) reached.add(edge.to);
  assert.equal(reached.size, spaces.length);
  assert.deepEqual(kantoBoard.get("cerulean").edges.map(e => e.to).sort(),["g4","ge2","ge6"]);
  assert.equal(kantoBoard.get("saffron").edges.length,4);
  assert.equal(kantoBoard.get("fuchsia").edges.length,3);
  assert.equal(kantoBoard.get("indigo-arrival").edges[0].to,"indigo-1");
  for (const s of spaces) for (const edge of s.edges) {
    if (edge.rule === "road" || edge.rule === "after-cerulean") {
      assert.ok(kantoBoard.get(edge.to).edges.some(reverse => reverse.to === s.id));
    }
  }
});
