import test from "node:test";
import assert from "node:assert/strict";
import { chips, expectedCounts, itemTypes, eventTypes, rivals, evolutionGroups } from "../game-data/catalog.mjs";

test("fichas formam um conjunto de 150 números distintos na distribuição do manual", () => {
  assert.deepEqual(chips.map(chip => chip.id), Array.from({length: 150}, (_, i) => i + 1));
  const counts = {};
  for (const chip of chips) {
    counts[chip.color] = (counts[chip.color] ?? 0) + 1;
    assert.ok(Number.isInteger(chip.power) && chip.power > 0);
    assert.ok(Number.isInteger(chip.attack) && chip.attack > 0);
  }
  assert.deepEqual(counts, { starter: 6, pink: 35, green: 41, blue: 38, red: 26, yellow: 4 });
});

test("faces de captura por cor correspondem às imagens fornecidas", () => {
  const expected = { starter: [], green: [4, 5], pink: [3, 4, 5], blue: [3, 4], red: [5], yellow: [6] };
  for (const chip of chips) assert.deepEqual(chip.captureFaces, expected[chip.color]);
});

test("nomes dos iniciais e correção de Charmander", () => {
  assert.deepEqual(chips.filter(chip => chip.color === "starter").map(chip => chip.name),
    ["Bulbasaur", "Charmander", "Squirtle", "Pikachu", "Clefairy", "Meowth"]);
  const charmander = chips.find(chip => chip.name === "Charmander");
  assert.equal(charmander.attack, 4);
  assert.equal(charmander.power, 5);
});

test("os dois baralhos têm 54 cartas e tipos identificáveis", () => {
  for (const [types, total] of [[itemTypes, expectedCounts.items], [eventTypes, expectedCounts.events]]) {
    assert.equal(types.reduce((sum, card) => sum + card.count, 0), total);
    assert.equal(new Set(types.map(card => card.id)).size, types.length);
    for (const card of types) assert.ok(Number.isInteger(card.count) && card.count > 0);
  }
});

test("forças e bônus das cinco cartas de rival, com o exemplo oficial de Lance", () => {
  assert.equal(rivals.length, expectedCounts.rivals);
  const lance = rivals.find(rival => rival.name === "Lance");
  assert.equal(lance.attack + 2 + lance.bonusByFace[1], 23);
  assert.deepEqual(rivals.map(rival => rival.attack), [10, 11, 12, 14, 15]);
  for (const rival of rivals) assert.deepEqual(rival.bonusByFace, [6, 7, 8, 7, 8, 6]);
});

test("grupos identificados no diagrama 4; força de Dratini impressa na ficha local", () => {
  assert.deepEqual(evolutionGroups, [[25, 26], [1, 2, 3]]);
  assert.equal(chips.find(chip => chip.id === 147).attack, 5);
});

