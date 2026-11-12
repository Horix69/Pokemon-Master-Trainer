import { allowsTimeMachine } from './random.mjs';
import { chips, evolutionGroups, itemTypes, rivals } from '../game-data/catalog.mjs'
import { sample, shuffle, rollDie } from './random.mjs'

// Every physical card and chip has an instance id, including identical cards.
// These functions consume decisions and dice supplied by the turn controller.
function requireRule(condition, message) {
  if (!condition) throw new RangeError(message)
}

function integer(value, minimum, maximum, label) {
  requireRule(Number.isInteger(value) && value >= minimum && value <= maximum, label)
  return value
}

function die(value) {
  return integer(value, 1, 6, 'Face de dado inválida.')
}

function owned(list, id) {
  const matches = list.filter(entry => entry.id === id)
  requireRule(matches.length === 1, 'Componente ausente ou duplicado.')
  return matches[0]
}

export function validPower(team) {
  return team.reduce((points, chip) => points + (chip.knockedOut ? 0 :
    integer(chip.power, 0, Number.MAX_SAFE_INTEGER, 'Poder desconhecido.')), 0)
}

export function canEnterPlateau(team) {
  return validPower(team) >= 20
}

export function evolutionBonus(team, chipId, groups) {
  const chip = owned(team, chipId)
  // Use species identifiers, since identical species may have different chip ids.
  const species = new Set(team.map(member => member.species ?? member.id))
  const complete = groups.filter(group => group.at(-1) === (chip.species ?? chip.id)
    && group.every(id => species.has(id)))
  if (!complete.length) return 0
  requireRule(complete.every(group => [2, 3].includes(group.length)), 'Grupo evolutivo inválido.')
  return Math.max(...complete.map(group => group.length === 2 ? 3 : 5))
}

// Capture commitments before revealing the dice. Remove reserved cards from the
// hand immediately so they cannot be used as a Time Machine, reward or trade.
export function commitFighter(player, chipId, cardIds = [], groups = []) {
  const chip = owned(player.team, chipId)
  requireRule(!chip.knockedOut, 'Pokémon nocauteado.')
  requireRule(cardIds.length <= 2 && new Set(cardIds).size === cardIds.length,
    'Escolha até duas cartas distintas.')
  const reserved = cardIds.map(id => owned(player.hand, id))
  for (const card of reserved) {
    requireRule(card.kind === 'attack-bonus', 'Carta inválida para o ataque.')
    integer(card.bonus, 1, 5, 'Bônus de carta inválido.')
  }
  return {
    player: { ...player, hand: player.hand.filter(card => !cardIds.includes(card.id)) },
    fighter: {
      playerId: player.id, chipId,
      attack: integer(chip.attack, 0, Number.MAX_SAFE_INTEGER, 'Ataque desconhecido.'),
      evolution: evolutionBonus(player.team, chipId, groups), reserved
    }
  }
}

export function publicCommitment(fighter) {
  return { playerId: fighter.playerId, chipId: fighter.chipId, cardCount: fighter.reserved.length }
}

function total(fighter, roll) {
  return fighter.attack + fighter.evolution + die(roll) +
    fighter.reserved.reduce((sum, card) => sum + card.bonus, 0)
}

function result(left, right) {
  return { totals: [left, right], outcome: left === right ? 'reroll' : left > right ? 'left' : 'right' }
}

export function battleRound(left, right, dice) {
  return result(total(left, dice[0]), total(right, dice[1]))
}

export function finalRound(fighter, rival, dice) {
  const roll = die(dice[1])
  requireRule(rival.bonusByRoll.length === 6, 'Tabela do rival incompleta.')
  const base = integer(rival.attack, 0, Number.MAX_SAFE_INTEGER, 'Ataque do rival desconhecido.')
  const bonus = integer(rival.bonusByRoll[roll - 1], 0, Number.MAX_SAFE_INTEGER,
    'Bônus do rival desconhecido.')
  return result(total(fighter, dice[0]), base + roll + bonus)
}

function setKnockout(team, id, knockedOut) {
  const chip = owned(team, id)
  requireRule(!!chip.knockedOut !== knockedOut, 'Condição do Pokémon incompatível.')
  return team.map(member => member.id === id ? { ...member, knockedOut } : member)
}

export function reviveOne(team, chipId) {
  return setKnockout(team, chipId, false)
}

export function centerChallenge(team, roll) {
  requireRule(team.filter(chip => chip.knockedOut).length >= 2, 'Desafio requer dois nocauteados.')
  return [1, 6].includes(die(roll))
    ? team.map(chip => chip.knockedOut ? { ...chip, knockedOut: false } : chip)
    : team.slice()
}

export function usePotion(player, itemDeck, cardId, chipId) {
  const card = owned(player.hand, cardId)
  requireRule(card.kind === 'potion', 'É necessária uma Potion.')
  return { player: { ...player, team: reviveOne(player.team, chipId),
    hand: player.hand.filter(entry => entry.id !== cardId) }, itemDeck: [...itemDeck, card] }
}

// sampleIndex(size) is supplied by the engine's seeded generator. No
// participant supplies the identity of an opponent's randomly selected card.
export function settleTrainerBattle(left, right, dice, itemDeck, sampleIndex, takeFromDeck) {
  const round = battleRound(left.fighter, right.fighter, dice)
  requireRule(round.outcome !== 'reroll', 'É necessário desempatar.')
  requireRule(typeof takeFromDeck === 'boolean', 'O vencedor escolhe se compra o complemento.')
  requireRule(left.player.id !== right.player.id, 'Selecione outro treinador.')
  const [winner, loser] = round.outcome === 'left' ? [left, right] : [right, left]
  const remaining = loser.player.hand.slice()
  const rewards = []
  while (rewards.length < 2 && remaining.length) {
    const index = integer(sampleIndex(remaining.length), 0, remaining.length - 1, 'Índice inválido.')
    rewards.push(...remaining.splice(index, 1))
  }
  const deck = [...itemDeck, ...left.fighter.reserved, ...right.fighter.reserved]
  if (takeFromDeck) rewards.push(...deck.splice(0, 2 - rewards.length))
  return {
    winner: { ...winner.player, hand: [...winner.player.hand, ...rewards] },
    loser: { ...loser.player, hand: remaining,
      team: setKnockout(loser.player.team, loser.fighter.chipId, true) },
    itemDeck: deck
  }
}

export function settleFinalBattle(contender, master, rival, dice, itemDeck) {
  requireRule(contender.player.id !== master.id, 'O rival cabe a outro treinador.')
  const round = finalRound(contender.fighter, rival, dice)
  requireRule(round.outcome !== 'reroll', 'É necessário desempatar.')
  const deck = [...itemDeck, ...contender.fighter.reserved]
  if (round.outcome === 'left') {
    return { winnerId: contender.player.id, contender: contender.player, master, itemDeck: deck,
      shuffleRivals: false }
  }
  return {
    winnerId: null, contender: { ...contender.player, position: 'cinnabar',
      team: setKnockout(contender.player.team, contender.fighter.chipId, true) },
    master: { ...master, hand: [...master.hand, ...deck.splice(0, 2)] },
    itemDeck: deck, shuffleRivals: true
  }
}

export function tradeable(team) {
  return team.filter(chip => !chip.starter)
}

export function resolveTrade(offerer, receiver, offer, response, itemDeck) {
  requireRule(offerer.id !== receiver.id, 'Selecione outro treinador.')
  requireRule(['passing', 'event'].includes(offer.reason), 'Origem de troca inválida.')
  const give = owned(tradeable(offerer.team), offer.give)
  const get = owned(tradeable(receiver.team), offer.get)
  const incentiveIds = offer.items ?? []
  requireRule(new Set(incentiveIds).size === incentiveIds.length, 'Carta repetida.')
  requireRule(offer.reason === 'passing' || incentiveIds.length === 0, 'Incentivo só na negociação.')
  const incentives = incentiveIds.map(id => owned(offerer.hand, id))
  if (response.type === 'decline') {
    requireRule(offer.reason === 'passing', 'A troca por evento exige aceite ou Poké Doll.')
    return { offerer, receiver, itemDeck, next: 'resume-move' }
  }
  if (response.type === 'doll') {
    requireRule(offer.reason === 'event', 'Uma oferta comum pode ser recusada.')
    const doll = owned(receiver.hand, response.cardId)
    requireRule(doll.kind === 'poke-doll', 'É necessária uma Poké Doll.')
    return { offerer, receiver: { ...receiver, hand: receiver.hand.filter(c => c.id !== doll.id) },
      itemDeck: [...itemDeck, doll], next: 'end-turn' }
  }
  requireRule(response.type === 'accept', 'Resposta inválida.')
  return {
    offerer: { ...offerer, team: offerer.team.map(c => c.id === give.id ? get : c),
      hand: offerer.hand.filter(c => !incentiveIds.includes(c.id)),
      position: offer.reason === 'passing' ? receiver.position : offerer.position },
    receiver: { ...receiver, team: receiver.team.map(c => c.id === get.id ? give : c),
      hand: [...receiver.hand, ...incentives] },
    itemDeck, next: 'end-turn'
  }
}

// Turn-controller adapter. Each action is checked before changing the caller's
// draft state. Dice are generated inside this boundary, after commitments.
const byId = new Map(chips.map(chip => [chip.id, chip]))
const names = Object.fromEntries(itemTypes.map(item => [item.id, item.name]))
const option = (type, label, fields = {}) => ({ type, label, ...fields })
function roster(player) {
  return player.team.map(slot => ({ ...byId.get(slot.id), ...slot, starter: byId.get(slot.id).color === 'starter' }))
}
function itemCard(type, id) {
  return { id, type, kind: type.startsWith('bonus-') ? 'attack-bonus' : type,
    bonus: type.startsWith('bonus-') ? Number(type.slice(6)) : 0 }
}
function participant(player) {
  return { ...player, position: player.pos, team: roster(player),
    hand: player.hand.map((type, index) => itemCard(type, index)) }
}
function writeParticipant(s, player) {
  const target = s.players[player.id]
  target.pos = player.position
  target.team = player.team.map(({ id, knockedOut }) => ({ id, knockedOut: !!knockedOut }))
  target.hand = player.hand.map(card => card.type)
}
function finish(s, phase = 'end') {
  s.phase = phase
  s.actor = s.turn
  s.encounter = null
}
function takeRival(s, opponent) {
  const e = s.encounter
  e.opponent = opponent
  e.rival = s.rivals.shift()
  requireRule(rivals.some(r => r.name === e.rival), 'Carta de rival desconhecida.')
  e.stage = 'fighter'
  s.actor = s.turn
}
export function enterEncounter(s, kind, opponent) {
  delete s.roundScore
  requireRule(['battle','event-battle','trade','forced-trade','final'].includes(kind), 'Encontro inválido.')
  if (kind !== 'final' || opponent !== undefined) {
    requireRule(opponent !== s.turn && !!s.players[opponent], 'Adversário inválido.')
  }
  s.phase = 'encounter'
  s.actor = s.turn
  s.encounter = { kind, opponent: opponent ?? null, stage: 'challenge',
    fighters: {}, choices: {}, dice: [], offer: { items: [] } }
  const e = s.encounter
  if (kind === 'final') {
    const candidates = s.players.filter(p => p.id !== s.turn).map(p => p.id)
    if (candidates.length === 1 || opponent !== undefined) takeRival(s, opponent ?? candidates[0])
    else {
      e.stage = 'elect'
      e.candidates = candidates
      e.votes = []
      s.actor = candidates[0]
    }
  } else if (kind === 'trade' || kind === 'forced-trade') {
    e.stage = 'offer'
    if (![s.turn, opponent].every(id => tradeable(roster(s.players[id])).length)) {
      finish(s, kind === 'trade' ? 'move' : 'end')
    }
  } else if (![s.turn,opponent].every(id => s.players[id].team.some(chip => !chip.knockedOut))) {
    finish(s, kind === 'battle' ? 'move' : 'end')
  } else s.actor = opponent
}

export function encounterActions(s) {
  const e = s.encounter
  if (s.phase !== 'encounter' || !e) return []
  const p = s.players[s.actor]
  switch (e.stage) {
    case 'elect': return [option('enc-elect','Rolar para representar o Mestre')]
    case 'challenge': case 'response': {
      const actions = [option('enc-accept', e.stage === 'challenge' ? 'Aceitar batalha' : 'Aceitar troca')]
      if (e.kind === 'trade') actions.push(option('enc-decline','Recusar troca'))
      else if (p.hand.includes('poke-doll')) actions.push(option('enc-doll','Usar Boneca Pokémon'))
      return actions
    }
    case 'offer': return tradeable(roster(p)).flatMap(give =>
      tradeable(roster(s.players[e.opponent])).map(get => option('enc-offer',
        'Oferecer ' + give.name + ' por ' + get.name, { give: give.id, get: get.id })))
    case 'incentive': {
      const remaining = p.hand.filter((_,i) => !e.offer.items.includes(i))
      return [option('enc-submit','Enviar proposta'), ...[...new Set(remaining)].map(type =>
        option('enc-incentive','Incluir ' + names[type], { card: type }))]
    }
    case 'fighter': return p.team.filter(chip => !chip.knockedOut).map(chip =>
      option('enc-fighter','Escolher ' + byId.get(chip.id).name, { chip: chip.id }))
    case 'bonus': {
      const choices = [option('enc-commit','Confirmar ataque')]
      if (e.reserved.length < 2) {
        const cards = p.hand.filter((type,index) => type.startsWith('bonus-') && !e.reserved.includes(index))
        for (const type of new Set(cards)) choices.push(option('enc-bonus','Reservar ' + names[type], { card: type }))
      }
      return choices
    }
    case 'roll': return [option('enc-roll','Rolar dado de ataque')]
    case 'elect-reaction': case 'reaction': {
      const actions = [option('enc-pass','Manter rolagem')]
      if ((allowsTimeMachine(s)) && p.hand.includes('time-machine')) actions.push(option('enc-reroll','Usar Máquina do Tempo'))
      return actions
    }
    case 'reward': return [option('enc-reward','Comprar o complemento do baralho',{draw:true}),
      option('enc-reward','Ficar com os itens do adversário',{draw:false})]
    default: throw new RangeError('Etapa do encontro desconhecida.')
  }
}

function matches(action, candidate) {
  return Object.entries(candidate).every(([key,value]) => key === 'label' || value === action[key])
}
function chooseCard(p, type, excluded) {
  return p.hand.findIndex((card,i) => card === type && !excluded.includes(i))
}
function battleSide(s, id) {
  return { player: participant(s.players[id]), fighter: s.encounter.fighters[id] }
}
function settleDuel(s, draw) {
  const e = s.encounter
  const deck = s.items.map(itemCard)
  const resolution = settleTrainerBattle(battleSide(s,s.turn),battleSide(s,e.opponent),
    e.dice,deck,n => sample(s,n),draw)
  writeParticipant(s,resolution.winner)
  writeParticipant(s,resolution.loser)
  s.items = resolution.itemDeck.map(card => card.type)
  s.log.push(s.players[resolution.winner.id].name + ' venceu a batalha.')
  finish(s)
}
function settleDice(s) {
  const e = s.encounter
  const challenger = battleSide(s,s.turn)
  const final = e.kind === 'final'
  const source = final ? rivals.find(r => r.name === e.rival) : null
  const rival = final ? { attack: source.attack, bonusByRoll: source.bonusByFace } : null
  const round = final ? finalRound(challenger.fighter,rival,e.dice)
    : battleRound(challenger.fighter,e.fighters[e.opponent],e.dice)
  s.roundScore = [s.turn,e.opponent].map((id,i)=>{
    const f=e.fighters[id],die=e.dice[i]
    return {id,base:f?.attack??source.attack,die,evolution:f?.evolution??0,
      items:f?.reserved.map(c=>c.bonus)??[],rival:f?0:source.bonusByFace[die-1],total:round.totals[i]}
  })
  for (const fighter of Object.values(e.fighters)) {
    const bonuses = fighter.reserved.map(card => names[card.type]).join(', ') || 'sem cartas de bônus'
    s.log.push(byId.get(fighter.chipId).name + ': ' + bonuses + '.')
  }
  s.log.push('Totais da batalha: ' + round.totals.join(' × ') + '.')
  if (round.outcome === 'reroll') {
    e.bonusesRevealed = true
    e.dice = []
    e.stage = 'roll'
    s.actor = s.turn
    return
  }
  if (final) {
    const settled = settleFinalBattle(challenger,participant(s.players[e.opponent]),rival,e.dice,s.items.map(itemCard))
    writeParticipant(s,settled.contender)
    writeParticipant(s,settled.master)
    s.items = settled.itemDeck.map(card => card.type)
    if (settled.winnerId !== null) {
      s.winner = s.turn
      // Keep the revealed rival within the physical inventory at game end.
      s.rivals.push(e.rival)
      s.log.push('Vitória na batalha final contra ' + e.rival + '.')
      finish(s,'won')
    } else {
      s.players[s.turn].pos = s.cinnabar
      s.rivals = shuffle(s,[...s.rivals,e.rival])
      s.log.push('Derrota contra ' + e.rival + '. Retorno a Cinnabar.')
      finish(s)
    }
    return
  }
  const loser = round.outcome === 'left' ? e.opponent : s.turn
  if (s.players[loser].hand.length < 2) {
    e.stage = 'reward'
    s.actor = loser === s.turn ? e.opponent : s.turn
  } else settleDuel(s,false)
}
function finishRoll(s) {
  const e = s.encounter
  if (e.dice.length === 2) settleDice(s)
  else {
    e.stage = 'roll'
    s.actor = e.opponent
  }
}
function nextReaction(s,roller) {
  const e = s.encounter
  // Eligibility is independent of hidden hands. Passing therefore does not
  // announce who owns a Time Machine before that card is played.
  e.reactors = Array.from({length:s.players.length},(_,i) => (roller+i)%s.players.length)
    .filter(id => !(e.kind === 'final' && id === e.opponent))
  e.stage = 'reaction'
  s.actor = e.reactors[0]
}
function completeVote(s) {
  const e = s.encounter
  s.log.push(s.players[e.candidates[e.votes.length-1]].name + ' rolou ' + e.votes.at(-1).roll + ' na seleção do Mestre.')
  e.stage = 'elect'
  if (e.votes.length < e.candidates.length) {
    s.actor = e.candidates[e.votes.length]
    return
  }
  const high = Math.max(...e.votes.map(vote => vote.roll))
  e.candidates = e.votes.filter(vote => vote.roll === high).map(vote => vote.id)
  e.votes = []
  if (e.candidates.length === 1) takeRival(s,e.candidates[0])
  else s.actor = e.candidates[0]
}
function markPassing(s) {
  const route = s.routes?.[s.meetingRoute]
  if (!route) return
  const meeting = route.meetings.find(m => m.playerId === s.encounter.opponent)
  if (meeting && route.path.slice(0,meeting.step+1).includes('cerulean')) s.players[s.turn].passedCerulean = true
}
function doTrade(s, response) {
  const e = s.encounter
  const settled = resolveTrade(participant(s.players[s.turn]),participant(s.players[e.opponent]),
    { ...e.offer, reason:e.kind === 'trade' ? 'passing':'event' },response,s.items.map(itemCard))
  writeParticipant(s,settled.offerer)
  writeParticipant(s,settled.receiver)
  if (e.kind === 'trade' && response.type === 'accept') markPassing(s)
  s.items = settled.itemDeck.map(card => card.type)
  if (settled.next === 'resume-move') {
    s.declined ??= []
    s.declined.push(e.opponent)
  }
  s.log.push(response.type === 'accept' ? 'Troca realizada.' : 'Troca recusada.')
  finish(s,settled.next === 'resume-move' ? 'move':'end')
}
export function applyEncounter(s, action) {
  requireRule(encounterActions(s).some(candidate => matches(action,candidate)), 'Ação de encontro inválida.')
  const e = s.encounter
  const p = s.players[s.actor]
  switch (action.type) {
    case 'enc-elect': {
      const roll = rollDie(s)
      e.votes.push({ id:p.id, roll })
      if(!allowsTimeMachine(s))completeVote(s)
      else {nextReaction(s,p.id); e.stage='elect-reaction'}
      break
    }
    case 'enc-offer':
      Object.assign(e.offer,{give:action.give,get:action.get})
      e.stage = e.kind === 'trade' ? 'incentive':'response'
      if (e.stage === 'response') s.actor = e.opponent
      break
    case 'enc-incentive': e.offer.items.push(chooseCard(p,action.card,e.offer.items)); break
    case 'enc-submit': e.stage = 'response'; s.actor = e.opponent; break
    case 'enc-decline': doTrade(s,{type:'decline'}); break
    case 'enc-doll':
      if (e.stage === 'response') doTrade(s,{type:'doll',cardId:p.hand.indexOf('poke-doll')})
      else {
        s.items.push(...p.hand.splice(p.hand.indexOf('poke-doll'),1))
        if (e.kind === 'battle') {
          s.declined ??= []
          s.declined.push(e.opponent)
        }
        finish(s,e.kind === 'battle' ? 'move':'end')
      }
      break
    case 'enc-accept':
      if (e.stage === 'response') doTrade(s,{type:'accept'})
      else {
        if (e.kind === 'battle') {
          s.players[s.turn].pos = p.pos
          markPassing(s)
        }
        e.stage = 'fighter'
        s.actor = s.turn
      }
      break
    case 'enc-fighter':
      e.choices[p.id] = action.chip
      if (e.kind !== 'final' && p.id === s.turn) s.actor = e.opponent
      else {
        s.actor = s.turn
        e.chip = e.choices[s.turn]
        e.reserved = []
        e.stage = 'bonus'
      }
      break
    case 'enc-bonus': e.reserved.push(chooseCard(p,action.card,e.reserved)); break
    case 'enc-commit': {
      const committed = commitFighter(participant(p),e.chip,e.reserved,evolutionGroups)
      e.fighters[p.id] = committed.fighter
      writeParticipant(s,committed.player)
      delete e.chip
      delete e.reserved
      if (p.id === s.turn && e.kind !== 'final') {
        s.actor = e.opponent
        e.chip = e.choices[e.opponent]
        e.reserved = []
        e.stage = 'bonus'
      } else {
        s.actor = s.turn
        e.stage = 'roll'
        if (e.kind === 'final') s.log.push('Mestre revelado: ' + e.rival + '.')
      }
      break
    }
    case 'enc-roll':
      delete s.roundScore
      e.dice.push(rollDie(s));
      if(!allowsTimeMachine(s))finishRoll(s);
      else nextReaction(s,p.id);
      break
    case 'enc-reroll':
      s.items.push(...p.hand.splice(p.hand.indexOf('time-machine'),1))
      if (e.stage === 'elect-reaction') {
        e.votes.at(-1).roll = rollDie(s)
        nextReaction(s,p.id)
        e.stage = 'elect-reaction'
      } else {
        e.dice[e.dice.length-1] = rollDie(s)
        nextReaction(s,p.id)
      }
      break
    case 'enc-pass':
      e.reactors.shift()
      if (e.reactors.length) s.actor = e.reactors[0]
      else if (e.stage === 'elect-reaction') completeVote(s)
      else finishRoll(s)
      break
    case 'enc-reward': settleDuel(s,action.draw); break
  }
  return s
}

export function encounterView(s, viewer) {
  const e = s.encounter
  if (!e) return null
  const revealed = ['roll','reaction','reward'].includes(e.stage)
  const view = { kind:e.kind, stage:e.stage, opponent:e.opponent, turn:s.turn, actor:s.actor,
    dice:e.dice.slice(), fighters:Object.values(e.fighters).map(f =>
      viewer === f.playerId || e.stage === 'reward' || e.bonusesRevealed ? { ...publicCommitment(f),
        cards:f.reserved.map(card => card.type) } : publicCommitment(f)) }
  if (e.stage !== 'fighter') view.choices = { ...e.choices }
  else if (viewer in e.choices) view.choices = { [viewer]:e.choices[viewer] }
  if (e.rival && (revealed || viewer === e.opponent)) view.rival = e.rival
  if (e.stage === 'elect-reaction') view.vote = { ...e.votes.at(-1) }
  if (e.stage === 'bonus' && viewer === s.actor) {
    view.chip = e.chip
    view.reserved = e.reserved.map(i => s.players[s.actor].hand[i])
  }
  if (e.offer.give !== undefined && (viewer === s.turn || e.stage === 'response')) {
    view.offer = { give:e.offer.give, get:e.offer.get, items:e.offer.items.map(i => s.players[s.turn].hand[i]) }
  }
  return view
}

export function evaluateEncounterAction(view, action, difficulty) {
  const e = view.encounter ?? view
  const simple = difficulty === 'easy' || difficulty === 'facil'
  const chip = byId.get(action.chip)
  switch (action.type) {
    case 'enc-fighter': return chip.attack
    case 'enc-offer': return byId.get(action.get).power - byId.get(action.give).power
    case 'enc-accept':
      return e.offer ? byId.get(e.offer.give).power - byId.get(e.offer.get).power + e.offer.items.length : 1
    case 'enc-doll': return e.offer ? -0.5 : 0
    case 'enc-decline': return 0
    case 'enc-commit': return !simple && e.kind === 'final' ? -1 : 1
    case 'enc-bonus': return (simple ? 0 : Number(action.card.slice(6))) + (e.kind === 'final' ? 3 : -1)
    case 'enc-submit': return 1
    case 'enc-reward': return action.draw ? 1 : 0
    case 'enc-reroll': {
      if (e.vote) return !simple && e.vote.id === e.actor && e.vote.roll === 1 ? 0.5 : -1
      const roller = e.dice.length === 1 ? e.turn : e.opponent
      if (simple || (e.actor !== e.turn && e.actor !== e.opponent)) return -1
      const face = e.dice.at(-1)
      return (roller === e.actor ? 3.5-face : face-3.5) - 1
    }
    default: return 0
  }
}


