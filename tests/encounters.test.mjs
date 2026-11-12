import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validPower, canEnterPlateau, evolutionBonus, commitFighter, publicCommitment,
  battleRound, finalRound, reviveOne, centerChallenge, usePotion, settleTrainerBattle,
  settleFinalBattle, resolveTrade, enterEncounter, encounterActions, applyEncounter,
  encounterView, evaluateEncounterAction
} from '../game-core/encounters.mjs'

// Deliberately synthetic specimens. No test fixture is production catalog data.
const chip = (id, extras = {}) => ({ id, attack: 5, power: 5, knockedOut: false, ...extras })
const bonus = (id, value) => ({ id, kind: 'attack-bonus', bonus: value })
const potion = { id: 'p', kind: 'potion' }
const doll = { id: 'd', kind: 'poke-doll' }
const alice = { id: 'a', position: 'x', team: [chip('a1', { starter: true }), chip('a2')],
  hand: [bonus('a+', 1), bonus('a++', 3), potion] }
const bob = { id: 'b', position: 'y', team: [chip('b1')], hand: [doll] }
const rival = { attack: 5, bonusByRoll: [0, 1, 2, 3, 4, 5] }
const offer = { reason: 'passing', give: 'a2', get: 'b1', items: ['p'] }

test('poder válido exclui nocauteados e permite entrada a partir de 20', () => {
  const team = [chip('first', { power: 19 }), chip('ko', { power: 1, knockedOut: true })]
  assert.equal(validPower(team), 19)
  assert.equal(canEnterPlateau(team), false)
  assert.equal(canEnterPlateau(reviveOne(team, 'ko')), true)
  assert.throws(() => reviveOne(team, 'first'))
})

test('grupo completo dá bônus somente ao último membro', () => {
  for (const group of [['x', 'y'], ['x', 'y', 'z']]) {
    const team = group.map(species => chip('inst-' + species, { species }))
    assert.equal(evolutionBonus(team, team.at(-1).id, [group]), group.length === 2 ? 3 : 5)
    assert.equal(evolutionBonus(team, team[0].id, [group]), 0)
    assert.equal(evolutionBonus(team.slice(1), team.at(-1).id, [group]), 0)
  }
})

test('limite e sigilo dos bônus; empate devolve nova rolagem', () => {
  const left = commitFighter(alice, 'a2', ['a+', 'a++'])
  const right = commitFighter(bob, 'b1')
  assert.deepEqual(left.player.hand, [potion])
  assert.deepEqual(publicCommitment(left.fighter), {playerId:'a', chipId:'a2', cardCount:2})
  assert.deepEqual(battleRound(left.fighter,right.fighter,[1,5]), {totals:[10,10],outcome:'reroll'})
  assert.throws(() => settleTrainerBattle(left,right,[1,5],[],()=>0,true))
  assert.throws(() => battleRound(left.fighter,right.fighter,[0,5]))
  for (const ids of [['p'],['a+', 'a+'],['a+', 'a++', 'p']]) {
    assert.throws(() => commitFighter(alice, 'a2', ids))
  }
  assert.throws(() => commitFighter({...alice,team:[chip('ko',{knockedOut:true})]}, 'ko'))
})

test('prêmio usa a mão restante do perdedor e complemento opcional do topo', () => {
  const left = commitFighter(alice, 'a2', ['a+'])
  const right = commitFighter(bob, 'b1')
  const top = bonus('top', 1)
  const given = settleTrainerBattle(left,right,[6,1],[top],()=>0,true)
  assert.equal(given.loser.team[0].knockedOut, true)
  assert.deepEqual(given.winner.hand.slice(-2), [doll,top])
  assert.deepEqual(given.itemDeck,[alice.hand[0]])
  assert.equal(bob.team[0].knockedOut,false)
  const declined = settleTrainerBattle(left,right,[6,1],[top],()=>0,false)
  assert.deepEqual(declined.itemDeck,[top,alice.hand[0]])
  const stolen = settleTrainerBattle(left,right,[1,6],[],n=>n-1,true)
  assert.deepEqual(stolen.winner.hand,[doll,potion,alice.hand[1]])
  assert.deepEqual(stolen.loser.hand,[])
})

test('centro com dois nocauteados e poção com descarte no fundo', () => {
  const ko = alice.team.map(c=>({...c,knockedOut:true}))
  for (let d=1; d<=6; d++) {
    assert.equal(centerChallenge(ko,d).filter(c=>c.knockedOut).length, [1,6].includes(d) ? 0 : 2)
  }
  assert.throws(() => centerChallenge([ko[0]],1))
  const result = usePotion({...alice,team:ko},[doll],'p','a2')
  assert.deepEqual(result.itemDeck,[doll,potion])
  assert.equal(result.player.hand.length,2)
  assert.deepEqual(result.player.team.map(c=>c.knockedOut),[true,false])
})

test('troca aceita conserva condição e incentivos; recusa retoma caminho', () => {
  const koBob = {...bob, team:[chip('b1',{knockedOut:true})]}
  const result = resolveTrade(alice,koBob,offer,{type:'accept'},[])
  assert.equal(result.offerer.position,bob.position)
  assert.equal(result.offerer.team[1].knockedOut,true)
  assert.deepEqual(result.receiver.hand,[doll,potion])
  assert.equal(result.offerer.hand.length,2)
  assert.equal(resolveTrade(alice,bob,offer,{type:'decline'},[]).next,'resume-move')
  assert.throws(() => resolveTrade(alice,bob,{...offer,give:'a1'},{type:'accept'},[]))
})

test('troca forçada exige aceite ou Poké Doll e preserva posições', () => {
  const forced = {...offer,reason:'event',items:[]}
  assert.throws(() => resolveTrade(alice,bob,forced,{type:'decline'},[]))
  const stopped = resolveTrade(alice,bob,forced,{type:'doll',cardId:'d'},[])
  assert.deepEqual(stopped.itemDeck,[doll])
  assert.deepEqual(stopped.receiver.hand,[])
  assert.equal(stopped.offerer,alice)
  assert.equal(resolveTrade(alice,bob,forced,{type:'accept'},[]).offerer.position,alice.position)
})

test('batalha final usa a face do rival, desempata e devolve a Cinnabar após derrota', () => {
  const contender = commitFighter(alice,'a2',['a+'])
  const deck = [bonus('deck1',1),bonus('deck2',2)]
  assert.equal(finalRound(contender.fighter,rival,[2,2]).outcome,'reroll')
  assert.throws(() => settleFinalBattle(contender,bob,rival,[2,2],deck))
  assert.equal(settleFinalBattle(contender,bob,rival,[6,1],deck).winnerId,'a')
  const lost = settleFinalBattle(contender,bob,rival,[1,6],deck)
  assert.equal(lost.winnerId,null)
  assert.equal(lost.contender.position,'cinnabar')
  assert.equal(lost.contender.team[1].knockedOut,true)
  assert.deepEqual(lost.master.hand,[doll,...deck])
  assert.deepEqual(lost.itemDeck,[alice.hand[0]])
  assert.equal(lost.shuffleRivals,true)
})

const boardPlayer = (id, ids, hand) => ({id,pos:String(id),team:ids.map(id=>({id,knockedOut:false})),hand})
function turn(seed = 1) {
  return { turn:0, actor:0, players:[
    boardPlayer(0,[1,2,3,150],['bonus-5','bonus-5','time-machine']),
    boardPlayer(1,[4,22],['poke-doll','bonus-1']),
    boardPlayer(2,[7,11],['potion'])
  ], log:[], rng:seed, items:['fly','potion'], rivals:['Lorelei','Bruno','Agatha','Lance','Gary'],
  declined:[], routes:[{id:'road'}], cinnabar:'cinnabar-island' }
}
function play(s,type,check=()=>true) {
  const action = encounterActions(s).find(a=>a.type===type && check(a))
  assert.ok(action,'Opção ' + type + ' em ' + JSON.stringify(s.encounter))
  applyEncounter(s,action)
}
function automate(s) {
  let steps = 0
  while (s.phase === 'encounter') {
    assert.ok(++steps < 300)
    const view = encounterView(s,s.actor)
    const actions = encounterActions(s)
    const top = actions.sort((a,b)=>evaluateEncounterAction(view,b,'hard')-evaluateEncounterAction(view,a,'hard'))[0]
    applyEncounter(s,top)
  }
}
test('controlador de troca usa os incentivos escolhidos e preserva a rota ao recusar', () => {
  const s = turn()
  enterEncounter(s,'trade',1)
  play(s,'enc-offer',a=>a.give===2 && a.get===22)
  play(s,'enc-incentive',a=>a.card==='bonus-5')
  play(s,'enc-submit')
  assert.equal(s.actor,1)
  assert.deepEqual(encounterView(s,1).offer,{give:2,get:22,items:['bonus-5']})
  const resumed = structuredClone(s)
  play(s,'enc-accept')
  assert.deepEqual(s.players[0].team.map(c=>c.id),[1,22,3,150])
  assert.equal(s.players[0].pos,'1')
  assert.equal(s.players[1].hand.at(-1),'bonus-5')
  play(resumed,'enc-decline')
  assert.equal(resumed.phase,'move')
  assert.deepEqual(resumed.routes,[{id:'road'}])
  assert.deepEqual(resumed.declined,[1])
  enterEncounter(resumed,'forced-trade',1)
  play(resumed,'enc-offer')
  assert.throws(()=>applyEncounter(resumed,{type:'enc-decline'}))
  play(resumed,'enc-doll')
  assert.equal(resumed.items.at(-1),'poke-doll')
  assert.equal(resumed.players[0].pos,'0')
})

test('controlador de batalha omite escolhas privadas, permite reação de terceiro e retoma seed', () => {
  const s = turn()
  s.players[2].hand.push('time-machine')
  enterEncounter(s,'battle',1)
  play(s,'enc-accept')
  play(s,'enc-fighter',a=>a.chip===3)
  assert.equal(encounterView(s,1).choices,undefined)
  play(s,'enc-fighter')
  play(s,'enc-bonus')
  play(s,'enc-commit')
  assert.equal(encounterView(s,1).fighters[0].cardCount,1)
  assert.equal(encounterView(s,1).fighters[0].cards,undefined)
  play(s,'enc-commit')
  play(s,'enc-roll')
  play(s,'enc-pass')
  play(s,'enc-pass')
  assert.equal(s.actor,2)
  play(s,'enc-reroll')
  assert.deepEqual(s.players[2].hand,['potion'])
  const resumed = JSON.parse(JSON.stringify(s))
  automate(s)
  automate(resumed)
  assert.deepEqual(s,resumed)
  assert.equal(s.phase,'end')
  assert.equal(s.players.flatMap(p=>p.team).filter(c=>c.knockedOut).length,1)
})
test('300 confrontos finais com eleição, sigilo, vitória, derrota e conservação', () => {
  const results = new Set()
  for (let seed=0;seed<300;seed++) {
    const s = turn(seed)
    const inventory = s.players.flatMap(p=>p.hand).concat(s.items).sort()
    enterEncounter(s,'final')
    while (s.encounter.stage.startsWith('elect')) {
      play(s,s.encounter.stage === 'elect' ? 'enc-elect' : 'enc-pass')
    }
    assert.equal(encounterView(s,s.turn).rival,undefined)
    assert.equal(encounterView(s,s.encounter.opponent).rival,'Lorelei')
    automate(s)
    results.add(s.phase)
    assert.equal(s.rivals.length,5)
    assert.deepEqual(s.players.flatMap(p=>p.hand).concat(s.items).sort(),inventory)
    if (s.phase === 'won') assert.equal(s.winner,0)
    else assert.equal(s.players[0].pos,s.cinnabar)
  }
  assert.deepEqual(results,new Set(['end','won']))
})
