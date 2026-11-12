// A semente é persistida depois de cada amostra. Rejeição evita viés modular.
export function sample(state, size) {
  if (!Number.isInteger(size) || size < 1 || size > 0x100000000) throw new RangeError('Intervalo inválido');
  const limit = 0x100000000 - 0x100000000 % size;
  let result;
  do {
    state.rng = (state.rng + 0x6d2b79f5) >>> 0;
    let bits = state.rng;
    bits = Math.imul(bits ^ bits >>> 15, bits | 1);
    bits ^= bits + Math.imul(bits ^ bits >>> 7, bits | 61);
    result = (bits ^ bits >>> 14) >>> 0;
  } while (result >= limit);
  return result % size;
}
export function shuffle(state, values) {
  const result = [...values];
  for (let end = result.length - 1; end > 0; end--) {
    const other = sample(state, end + 1);
    [result[end], result[other]] = [result[other], result[end]];
  }
  return result;
}
export function rollDie(state) {
  const face = 1 + sample(state, 6);
  state.dieResult = face;
  return face;
}

// A faixa intermediária reproduz as partidas da versão 1.8, sem reações.
export function allowsTimeMachine(s) {
  return s.legacyUntil===undefined || s.history.length<s.legacyUntil || s.history.length>=s.timeMachineFrom;
}
