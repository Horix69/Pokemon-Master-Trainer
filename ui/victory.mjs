import {power} from '../game-core/setup.mjs';

export function victoryStats(state){
  const winner=state.players[state.winner];
  return {
    name:winner.name, points:power(winner), team:winner.team.length,
    captures:state.journal.reduce((n,row)=>n+row.details.filter(line=>line.startsWith(winner.name+' capturou ')).length,0),
    turns:state.number,
    rerolls:state.history.filter(([id,a])=>id===winner.id && ['reroll','enc-reroll'].includes(a.type)).length,
    sprite:state.profiles?.[winner.id]?.sprite??winner.id+1,
  };
}
export function victoryScreen(state, color, chipImage){
  const stats=victoryStats(state),winner=state.players[state.winner];
  const tiles=[[stats.points,'Pontos de poder'],[stats.captures,'Capturas com dado'],[stats.team,'Pokémon na equipe'],[stats.turns,'Turnos da partida']];
  return '<section class="victoryScreen" style="--winner-color:'+color+'">'+
    '<div class="victoryConfetti" aria-hidden="true">'+Array.from({length:32},(_,i)=>'<i style="--i:'+i+';--x:'+(i*37%100)+'%;--r:'+(i*43)+'deg"></i>').join('')+'</div>'+
    '<header><span class="victoryEyebrow">INDIGO PLATEAU · HALL DA FAMA</span><h2>Temos um novo Mestre!</h2><p>O desafio final foi vencido. Esta aventura é sua.</p></header>'+
    '<div class="victoryHero"><div class="victoryHalo"></div><span class="victoryCrown" aria-hidden="true">★</span><img class="victoryTrainer" src="assets/trainers/'+stats.sprite+'.png" alt="Personagem de '+stats.name+'"><div class="victoryPedestal"></div></div>'+
    '<h3 class="victoryName">'+stats.name+'</h3><p class="victorySubtitle">CAMPEÃO DA PARTIDA'+(winner.id>=state.humans?' · IA':'')+'</p>'+
    '<div class="victoryStats">'+tiles.map(([value,label])=>'<div><strong>'+value+'</strong><span>'+label+'</span></div>').join('')+'</div>'+
    '<p class="victoryNote">Pontos dos Pokémon ativos ao vencer · '+stats.rerolls+' uso(s) da Máquina do Tempo</p>'+
    '<div class="victoryTeam" aria-label="Equipe campeã">'+winner.team.map(c=>chipImage(c.id,c.knockedOut?'victoryChip ko':'victoryChip')).join('')+'</div>'+
    '<footer><button class="btn primary" id="finishReview">Explorar a mesa final</button><button class="btn" id="victoryHome">Voltar ao menu</button></footer></section>';
}
