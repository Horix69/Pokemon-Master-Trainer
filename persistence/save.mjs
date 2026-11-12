import { newGame } from '../game-core/setup.mjs';
import { step } from '../game-core/engine.mjs';
const key='pmt1999.game.v1';
export function save(s,storage=localStorage) {
  storage.setItem(key,JSON.stringify({version:1,strictBallFrom:s.strictBallFrom,timeMachineFrom:s.timeMachineFrom,legacyUntil:s.legacyUntil,seed:s.seed,count:s.count,humans:s.humans,difficulty:s.difficulty,profiles:s.profiles,history:s.history}));
}
export function load(storage=localStorage){
  const raw=storage.getItem(key);if(raw===null)return null;
  const data=JSON.parse(raw);
  if(data.version!==1 || !Array.isArray(data.history))throw new Error('Formato de partida incompatível.');
  let state=newGame(data.seed,data.count,data.difficulty,data.humans,data.profiles);
  state.strictBallFrom=data.strictBallFrom??data.history.length;
  state.legacyUntil=data.legacyUntil??data.history.length;
  state.timeMachineFrom=data.timeMachineFrom??data.history.length;
  for(const [actor,action] of data.history)state=step(state,actor,action);
  return state;
}


