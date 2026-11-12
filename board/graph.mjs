// Cada conexão é dirigida; o leitor dos dados nunca cria o sentido inverso.
const kinds = new Set(["city", "center", "catch", "event", "plateau"]);
const landmarks = new Set(["pallet", "cerulean", "cinnabar"]);
const edgeRules = new Set(["road", "after-cerulean", "enter-plateau", "clockwise"]);

/** Valida e indexa uma transcrição, sem depender do DOM ou do estado de jogo. */
export function createBoard(spaces) {
  if (!Array.isArray(spaces) || !spaces.length) throw new Error("Transcrição do tabuleiro ausente.");
  const index = new Map();
  const usedLandmarks = new Set();
  for (const s of spaces) {
    if (!s || typeof s.id !== "string" || !s.id || index.has(s.id)) throw new Error("Identificador de casa inválido ou duplicado.");
    if (!kinds.has(s.kind) || !Array.isArray(s.edges) || !Array.isArray(s.actions)
        || !Number.isFinite(s.x) || !Number.isFinite(s.y)) throw new Error("Casa incompleta: " + s.id);
    if (s.landmark && (!landmarks.has(s.landmark) || usedLandmarks.has(s.landmark))) throw new Error("Marco inválido.");
    usedLandmarks.add(s.landmark);
    const targets = new Set();
    const edges = s.edges.map(edge => {
      if (!edge || typeof edge.to !== "string" || !edgeRules.has(edge.rule) || edge.to === s.id || targets.has(edge.to)) {
        throw new Error("Conexão inválida: " + s.id);
      }
      targets.add(edge.to);
      return Object.freeze({ to: edge.to, rule: edge.rule });
    });
    index.set(s.id, Object.freeze({
      id: s.id, kind: s.kind, x: s.x, y: s.y, color: s.color ?? null,
      landmark: s.landmark ?? null, actions: Object.freeze([...s.actions]), edges: Object.freeze(edges)
    }));
  }
  for (const s of index.values()) {
    if (s.kind === "plateau" && s.edges.length !== 1) throw new Error("O circuito precisa de uma única saída horária por casa.");
    for (const e of s.edges) {
      const dest = index.get(e.to);
      if (!dest) throw new Error("Destino desconhecido: " + e.to);
      if (s.kind === "plateau" && (e.rule !== "clockwise" || dest.kind !== "plateau")) throw new Error("Saída inválida do circuito.");
      if (e.rule === "clockwise" && s.kind !== "plateau") throw new Error("Seta horária fora do circuito.");
      if (dest.kind === "plateau" && s.kind !== "plateau" && (s.landmark !== "cinnabar" || e.rule !== "enter-plateau")) throw new Error("Entrada inválida no circuito.");
      if (e.rule === "enter-plateau" && dest.kind !== "plateau") throw new Error("Destino de entrada inválido.");
    }
  }
  return Object.freeze({ get: id => index.get(id), spaces: Object.freeze([...index.values()]) });
}

/** occupants relaciona IDs de casas a listas de IDs de treinadores presentes. */
export function getLegalRoutes(board, { start, roll, occupants = {}, playerId, passedCerulean = false, power = 0 }) {
  if (!board.get(start) || !Number.isInteger(roll) || roll < 1 || roll > 6 || !Number.isFinite(power) || power < 0) {
    throw new Error("Consulta de movimento inválida.");
  }
  const routes = [];
  function walk(path, steps, freeDirection, skipped) {
    const current = board.get(path.at(-1));
    const others = (occupants[current.id] ?? []).filter(id => id !== playerId);
    const island = current.landmark === "cinnabar";
    const mayLand = steps > 0 && (island || (steps >= roll && !others.length));
    const extended = steps > roll;
    if (mayLand) {
      const meetings = [];
      for (let i = 1; i < path.length - 1; i++) {
        const ids = (occupants[path[i]] ?? []).filter(id => id !== playerId);
        if (ids.length === 1) meetings.push({ step: i, space: path[i], playerId: ids[0] });
      }
      routes.push({
        path, destination: current.id, passedCerulean: freeDirection,
        exact: steps === roll, extended, meetings
      });
    }
    if (steps >= roll && mayLand) return;
    // Uma volta sem destino livre esgota a busca de deslocamento por ocupação.
    if (steps >= roll && skipped.has(current.id)) return;
    const nextSkipped = steps >= roll ? new Set([...skipped, current.id]) : skipped;
    for (const edge of current.edges) {
      const next = board.get(edge.to);
      if (edge.rule === "after-cerulean" && !freeDirection) continue;
      if (edge.rule === "enter-plateau" && (steps !== 0 || power < 20)) continue;
      if (edge.rule !== "clockwise" && path.includes(next.id)) continue;
      // O jogador entra na casa de chegada e só então lança o dado no circuito.
      const nextSteps = edge.rule === "enter-plateau" ? steps : steps + 1;
      walk([...path, next.id], nextSteps, freeDirection || next.landmark === "cerulean", nextSkipped);
    }
  }
  walk([start], 0, passedCerulean || board.get(start).landmark === "cerulean", new Set());
  return routes;
}

/** Retorna a rota recalculada pelo motor. Nunca confia em efeitos enviados pela UI. */
export function resolveRoute(board, movement, path) {
  if (!Array.isArray(path)) return null;
  return getLegalRoutes(board, movement).find(route =>
    route.path.length === path.length && route.path.every((id, i) => id === path[i])
  ) ?? null;
}

export function isLegalRoute(board, movement, path) {
  return resolveRoute(board, movement, path) !== null;
}
