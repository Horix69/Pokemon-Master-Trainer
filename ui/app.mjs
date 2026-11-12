import {victoryScreen} from './victory.mjs';
import {receivedItems, presentItems} from './itemReveal.mjs';
import {markRoutes,hintFor,frameRoutes} from './routePlanner.mjs';
import {evolutionBonus} from '../game-core/encounters.mjs';
import {evolutionGroups} from '../game-data/catalog.mjs';
import {travel} from './travel.mjs';
import {rollTargets} from './rollTargets.mjs';
import {completeProfiles,swatches} from '../game-core/profiles.mjs';
import { showDie } from './dice.ts';
import './music.ts';
import { mapLayer } from './Board.tsx';
import { newGame,power } from '../game-core/setup.mjs';
import { getLegalActions, observe, step, itemName, placeName } from '../game-core/engine.mjs';
import { chooseAction } from '../ai/strategy.mjs';
import { save,load } from '../persistence/save.mjs';
import { chips, itemTypes, eventTypes, rivals } from '../game-data/catalog.mjs';
import { kantoBoard,chipPositions } from '../board/kanto.mjs';

const $=id=>document.getElementById(id);
const trainerNames=['Dusty','Cristy','Brick','Irene','Leafy','Gory','Rocket','Team Player 1','Team Player 2'];
const palette=['#b64036','#295b9e','#4c7a42','#9163a0','#ab7525','#367c7d'];
let colors=[...palette];
const diff={easy:'Fácil',normal:'Normal',hard:'Difícil'};
const phases={pick:'Escolha seu inicial',tie:'Desempate inicial',turn:'Início do turno',move:'Escolha seu caminho',capture:'Captura de Pokémon',adjust:'Resultado da captura',heal:'Centro Pokémon',target:'Escolha uma ficha',react:'Reação ao dado',eventTrade:'Troca de Pokémon',eventFight:'Desafio de batalha',end:'Fim do turno',won:'Fim da partida'};
const stages={'elect-reaction':'Reação ao desempate',elect:'Escolha do Mestre',fighter:'Escolha o Pokémon',challenge:'Desafio de batalha',bonus:'Bônus de ataque',roll:'Dado de ataque',reaction:'Reação ao dado',reward:'Recompensa',offer:'Proposta de troca',incentive:'Itens da proposta',response:'Resposta à proposta'};
const col={pink:'rosa',red:'vermelha',blue:'azul',green:'verde',yellow:'amarela',starter:'inicial'};
const cardFiles={'great-ball':'GreatBall_Item','ultra-ball':'UltraBall_Item','master-ball':'MasterBall_Item','time-machine':'TimeMachine_Item',fly:'Fly_Item',potion:'Potion_Item','poke-doll':'PokeDoll_Item',center:'PokeCenter_Event',trade:'Swap_Event',fight:'Duel_Event',chance:'Chansey_Event',dungeon:'Legendary_Event'};
for(let i=1;i<=5;i++)cardFiles['bonus-'+i]=i+'Attack_Item';
for(let i=1;i<=3;i++)cardFiles['take-'+i]=i+'Item_Event';
const img=(id,cls='chipthumb')=>'<img class="'+cls+'" src="assets/chips/'+id+'.webp" alt="">';
const cardImg=id=>'<img class="cardface" src="assets/cards/'+cardFiles[id]+'_pt.webp" alt="">';
let state=null,saved=null,zoom=1,menu=false,storageProblem=false;
try{const c=Number(localStorage.getItem('pmt1999.pawn')??0);if(Number.isInteger(c)&&c>=0&&c<6)[colors[0],colors[c]]=[colors[c],colors[0]];saved=load();}catch{storageProblem=true;$('status').textContent='O salvamento anterior não pôde ser aberto. Uma nova partida criará outro registro.';}
function modal(title,html){clearTimeout(aiTimer);dismissPreview();$('title').textContent=title;$('content').innerHTML=html;if(!$('modal').open)$('modal').showModal();}
$('close').onclick=()=>$('modal').close();
function showChip(id){
 const c=chips.find(t=>t.id===Number(id));modal(c.name,img(c.id,'inspect')+'<div class="stats"><span><b>'+c.power+'</b>Poder</span><span><b>'+c.attack+'</b>Ataque</span></div><p>Ficha '+col[c.color]+' · '+(c.captureFaces.length?'Captura com '+c.captureFaces.join(', '):'Pokémon inicial')+'</p>');
}
function collection(){
 modal('Coleção de fichas','<input class="search" id="search" placeholder="Buscar por nome ou número" aria-label="Buscar ficha"><div class="collection" id="grid"></div>');
 function filter(){const q=$('search').value.toLowerCase().trim();$('grid').innerHTML=chips.filter(c=>c.name.toLowerCase().includes(q)||String(c.id)===q).map(c=>'<button data-chip="'+c.id+'">'+img(c.id,'chipicon')+'#'+String(c.id).padStart(3,'0')+' '+c.name+'</button>').join('')||'Nenhuma ficha encontrada.';}
 $('search').oninput=filter;filter();
}
$('catalogNav').onclick=collection;
$('rulesNav').onclick=()=>modal('Regras da mesa','<div class="rules"><h3>O início em Pallet Town</h3><p>Cada treinador escolhe uma ficha inicial virada para baixo. Começa quem tiver o menor poder. Os empatados rolam o dado.</p><h3>Movimento e captura</h3><p>Role um dado e escolha um caminho destacado. Uma ficha revelada indica as faces necessárias para a captura. Escolha a bola antes da rolagem e o ajuste depois. A ficha que escapar fica exposta, exceto na Unknown Dungeon.</p><h3>Treinadores</h3><p>Ao passar por um treinador sozinho, você pode propor uma troca ou batalha. Os iniciais permanecem com seus donos. O combate soma ataque, dado e até duas cartas de bônus. Pokémon nocauteados deixam de contribuir para os pontos de poder.</p><h3>Indigo Plateau</h3><p>Ao atingir 20 pontos válidos no fim do turno, siga para Cinnabar. Na região final, percorra o circuito horário e alcance a batalha por contagem exata. Derrote o Mestre para vencer.</p><p class="fine">Edição em conferência. Consulte docs/RULES_REFERENCE.md para divergências das artes traduzidas e limites desta versão.</p></div>');
$('settings').onclick=()=>modal('Configurações','<p class="hint">Durante a partida, você decide quando seguir para a próxima ação.</p>');
let checkpoint=null;
function returnToMenu(commit){
 if(state){
   try{
    if(commit)save(state);
    else if(checkpoint)save(checkpoint);
    else localStorage.removeItem('pmt1999.game.v1');
   }catch{ $('content').textContent='Não foi possível atualizar o salvamento no navegador.';return; }
   saved=commit?state:checkpoint;
 }
 menu=true;state=null;checkpoint=null;impact=null;
 if($('modal').open)$('modal').close();
 render();$('gameShell').hidden=true;document.querySelector('.welcome').hidden=false;
 document.getElementById('singleplayer').focus();
}
function requestExit(){
 if(presentingRoll)return;
 if(!state){returnToMenu(false);return;}
 modal('Voltar ao menu principal','<p>Deseja guardar as ações desta sessão?</p><div class="actions"><button id="saveExit" class="btn primary">Salvar e Sair</button><button id="discardExit" class="btn">Sair sem salvar</button></div>');
 $('saveExit').onclick=()=>returnToMenu(true);$('discardExit').onclick=()=>returnToMenu(false);
}
$('backMenu').onclick=requestExit;
$('tableNav').onclick=requestExit;
function setZoom(z){zoom=Math.max(1,Math.min(3,z));$('map').style.width=zoom*100+'%';$('scale').textContent=Math.round(zoom*100)+'%';}
$('plus').onclick=()=>setZoom(zoom+.5);$('minus').onclick=()=>setZoom(zoom-.5);$('scale').onclick=()=>setZoom(1);
const vp=$('viewport');let drag;
vp.onpointerdown=e=>{if(e.target.closest('button')||e.pointerType==='touch'||zoom===1)return;drag=[e.clientX,e.clientY,vp.scrollLeft,vp.scrollTop];vp.setPointerCapture(e.pointerId);vp.classList.add('drag');};
vp.onpointermove=e=>{if(drag){vp.scrollLeft=drag[2]-e.clientX+drag[0];vp.scrollTop=drag[3]-e.clientY+drag[1];}};
vp.onpointerup=vp.onpointercancel=()=>{drag=null;vp.classList.remove('drag');};
function persist(){try{save(state);saved=state;storageProblem=false;$('status').textContent='';}catch{saved=state;storageProblem=true;$('status').textContent='O navegador bloqueou o salvamento. A partida continua nesta janela.';}}
let multiplayer=false;
let viewer=0;
window.addEventListener('choose-mode',event=>{
 multiplayer=event.detail==='multiplayer';
 lobby();
 ($('humans')??$('count')).focus();
});
function start(){
 const humans=multiplayer?Number(document.getElementById('humans').value):1;viewer=0;const count=Number(document.getElementById('count').value)+humans,difficulty=$('level').value;
 let profiles;
 try{profiles=completeProfiles([...document.querySelectorAll('.identity')].map(row=>({name:row.querySelector('input').value.normalize('NFC'),color:row.querySelector('select').value,sprite:Number(row.querySelector('input[type=radio]:checked').value)})),count);}
 catch(error){$('identityError').textContent=error.message;return;}
 const begin=()=>{
   checkpoint=saved;impact=null;
   state=newGame(crypto.getRandomValues(new Uint32Array(1))[0],count,difficulty,humans,profiles);
   colors=profiles.map(p=>swatches[p.color]);menu=false;persist();render();
 };
 if(saved && saved.phase!=='won'){modal('Substituir partida salva?','<p>Uma nova mesa substituirá o progresso local.</p><button class="btn primary" id="replace">Iniciar nova partida</button>');$('replace').onclick=()=>{$('modal').close();begin();};}else begin();
}
function lobby(){
 $('gameShell').dataset.screen='camp';$('teamDock').replaceChildren();$('teamDock').hidden=true;
 $('panel').innerHTML='<div class="eyebrow">PREPARAÇÃO</div><h2>Nova partida</h2><p class="intro">Comece com uma ficha, capture Pokémon para reunir 20 pontos de poder e desafie um Mestre no Indigo Plateau.</p><div class="artstrip">'+[1,4,7,25].map(id=>img(id,'')).join('')+'</div><label class="field">Adversários de IA<select id="count">'+[1,2,3,4,5].map(n=>'<option value="'+n+'">'+n+(n===1?' adversário':' adversários')+'</option>').join('')+'</select></label><label class="field">Dificuldade<select id="level"><option value="easy">Fácil</option><option selected value="normal">Normal</option><option value="hard">Difícil</option></select></label><details><summary class="fine">Cor do seu peão</summary><label class="field"><select id="pawnColor" aria-label="Cor do seu peão"><option value="0">Vermelho</option><option value="1">Azul</option><option value="2">Verde</option><option value="3">Roxo</option><option value="4">Mostarda</option><option value="5">Turquesa</option></select></label></details><button class="btn primary wide" id="start">Iniciar partida &nbsp; →</button>'+(saved?'<button class="btn wide" id="resume">Continuar partida</button>':'');
 if(multiplayer){
   const count=$('count');
   $('panel').querySelector('h2').textContent='Multiplayer local';
   count.closest('label').insertAdjacentHTML('beforebegin','<label class="field">Jogadores locais<select id="humans">'+[2,3,4,5,6].map(n=>'<option>'+n+'</option>').join('')+'</select></label>');
   function updateCounts(){
     const maximum=6-Number($('humans').value);
     const previous=Number(count.value);
     count.replaceChildren(...Array.from({length:maximum+1},(_,n)=>new Option(String(n),String(n))));
     count.value=String(Math.min(previous,maximum));
     $('level').disabled=Number(count.value)===0;
   }
   count.value='';
   updateCounts();
   $('humans').onchange=updateCounts;
   count.onchange=()=>{$('level').disabled=Number(count.value)===0};
 }
 const box=document.createElement('div'); $('pawnColor').closest('details').replaceWith(box);
 function identities(){
  const size=multiplayer?Number($('humans').value):1;
  const rows=[...box.querySelectorAll('.identity')];
  for(const row of rows.slice(size))row.remove();
  for(let i=rows.length;i<size;i++){
    const row=document.createElement('fieldset');row.className='identity';
    row.innerHTML='<legend>Treinador '+(i+1)+'</legend><label>Nome <input maxlength="8" required value="'+['Alex','Lia','Rui','Nina','Caio','Bia'][i]+'"></label><label>Cor <select>'+Object.keys(swatches).map(c=>'<option>'+c+'</option>').join('')+'</select></label>';
    const used=[...box.querySelectorAll('select')].map(el=>el.value);
    row.querySelector('select').value=Object.keys(swatches).find(c=>!used.includes(c));
    const selector=document.createElement('div');
    selector.className='spriteGrid';
    selector.innerHTML=Array.from({length:trainerNames.length},(_,j)=>'<label title="'+trainerNames[j]+'"><input type="radio" name="sprite'+i+'" value="'+(j+1)+'" aria-label="'+trainerNames[j]+'" '+(j===i?'checked':'')+'><img src="assets/trainers/'+(j+1)+'.png" alt=""></label>').join('');
    const preview=document.createElement('div');
    preview.className='identityPortrait';preview.innerHTML='<img alt=""><b></b>';
    row.append(preview,selector);
    box.append(row);
  }
  for(const row of box.querySelectorAll('.identity')){
    row.style.setProperty('--trainer',swatches[row.querySelector('select').value]);
    row.querySelector('.identityPortrait b').textContent=trainerNames[Number(row.querySelector(':checked[type=radio]').value)-1];
    row.querySelector('.identityPortrait img').src=row.querySelector(':checked[type=radio]').nextElementSibling.src;
  }
  for(const el of box.querySelectorAll('select')){
    for(const opt of el.options)opt.disabled=[...box.querySelectorAll('select')].some(other=>other!==el && other.value===opt.value);
  }
 }
 box.oninput=()=>{identities();$('identityError').textContent='';};
 $('humans')?.addEventListener('change',identities);
 box.insertAdjacentHTML('afterend','<p id="identityError" role="alert"></p>');
 identities();
 $('start').onclick=start;if(saved)$('resume').onclick=()=>{checkpoint=saved;state=saved;colors=state.profiles?.map(p=>swatches[p.color])??[...palette];viewer=state.humans>1?-1:0;menu=false;render();};
 $('bottom').innerHTML='<div class="artfoot"><span class="ball"></span><div><b>Pokémon Master Trainer</b><p class="fine">Edição de 1999 · 2 a 6 treinadores</p></div></div>';
}
function traceRoute(event){
 const line=$('routepath')?.firstElementChild;if(!line)return;
 const b=event.target.closest('[data-action]');
 const a=b && state?.phase==='move' ? getLegalActions(state,viewer)[Number(b.dataset.action)] : null;
 const route=a?.route!==undefined ? state.routes[a.route] : null;
 line.setAttribute('points',route?route.path.map(id=>{const t=kantoBoard.get(id);return t.x*18+','+t.y*12;}).join(' '):'');
}
document.addEventListener('pointerover',traceRoute);document.addEventListener('focusin',traceRoute);
function ctx(v){
 const e=v.encounter, t=v.tiles[v.target]?.chip;let out='';
 if(['capture','adjust'].includes(v.phase)&&t)out=img(t.id,'heroChip')+'<p><b>'+t.name+'</b> · captura com '+t.captureFaces.join(', ')+'</p>';
 if(v.phase==='pick')out='<p class="hint">As seis fichas foram embaralhadas. Escolha uma delas.</p>';
 if(v.phase==='move')out='<p class="hint">Os destinos legais estão marcados no tabuleiro.</p>';
 if(v.phase==='target')out='<p class="hint">Selecione a ficha no tabuleiro ou na lista.</p>';
 if(e){if(e.rival)out+='<img class="cardface" src="assets/cards/'+e.rival+'_pt.webp" alt="'+e.rival+'">';
 if(e.offer)out+='<p>Oferta: '+chips[e.offer.give-1].name+' por '+chips[e.offer.get-1].name+'. Itens: '+(e.offer.items.map(itemName).join(', ')||'nenhum')+'.</p>';
 if(e.reserved?.length)out+='<p>Seu bônus reservado: '+e.reserved.map(itemName).join(', ')+'.</p>';
 if(e.choices)out+='<p>'+Object.entries(e.choices).map(([id,c])=>v.players[id].name+': '+chips[c-1].name).join(' · ')+'</p>';
 if(e.vote)out+='<p>Dado da eleição: '+e.vote.roll+'</p>';
 if(e.dice.length)out+='<p>Dados de batalha: '+e.dice.join(' × ')+'</p>';
 if(e.fighters.length)out+='<p class="fine">'+e.fighters.map(f=>v.players[f.playerId].name+' · '+(f.cards?.map(itemName).join(', ')||String(f.cardCount??0)+' bônus')).join('<br>')+'</p>';}
 if(v.lastEvent)out+='<details><summary>Evento · '+eventTypes.find(c=>c.id===v.lastEvent).name+'</summary>'+cardImg(v.lastEvent)+'</details>';
 if(v.roll && !['turn','pick','encounter'].includes(v.phase))out+='<p class="statusline">Dado &nbsp; <b class="die">'+v.roll+'</b></p>';
 if(v.phase==='react')out+='<p>O dado pertence a '+v.players[v.turn].name+'.</p>';
 return out;
}
const actionIcons={roll:'⚄',attempt:'◎',move:'➜',enter:'⚑',pick:'★',target:'◎',adjust:'⚄',end:'✓',opponent:'⚔',heal:'✚',challenge:'⚄',meet:'⇄','enc-roll':'⚄','enc-accept':'✓','enc-decline':'×','enc-commit':'⚔','enc-elect':'⚄',pass:'✓'};
const dieFace=n=>['⚀','⚁','⚂','⚃','⚄','⚅'][n-1]??String(n);
function destinationInfo(v,route){
 const space=kantoBoard.get(route.destination),tile=v.tiles[space.id],ko=v.players[v.turn].team.filter(c=>c.knockedOut).length;
 if(tile?.chip)return tile.chip.name+' · capture com '+tile.chip.captureFaces.map(dieFace).join(' ');
 if(tile)return 'Ficha '+col[tile.color]+' oculta';
 if(space.actions.includes('revive'))return ko?'Centro · '+ko+' para recuperar':'Centro · equipe saudável';
 if(space.actions.includes('draw-event'))return 'Compre uma carta de evento';
 if(space.actions.includes('final'))return route.exact?'Enfrente um Mestre':'Contagem inexata · sem batalha';
 const draw=space.actions.find(a=>a.startsWith('draw-item-'));if(draw)return 'Receba '+draw.slice(-1)+' carta(s) de item';
 const catchColor=space.actions.find(a=>a.startsWith('catch-'));if(catchColor)return 'Procure uma ficha '+col[catchColor.slice(6)];
 return space.kind==='catch'?'Casa de captura vazia':placeName(space.id);
}
let rhythm='guided',impact=null;
let framing=null,firstFork='';
function restoreCamera(){
 if(!framing)return;
 const previous=framing;framing=null;setZoom(previous.zoom);
 vp.scrollTo({left:previous.x,top:previous.y,behavior:'instant'});
}
function encountersAlong(v,route){
 const meetings=v.routes[route].meetings;
 return meetings.length?'Passa por '+meetings.map(m=>v.players[m.playerId].name).join(', '):'Siga pela estrada';
}

try{if(localStorage.getItem('pmt1999.rhythm')==='fast')rhythm='fast';}catch{}
function reportImpact(before,after){
 if(before.phase==='pick')return;
 const changes=[];
 for(const p of after.players){
  const old=before.players[p.id],oldPower=power(old),newPower=power(p);
  if(oldPower===newPower)continue;
  const acquired=p.team.find(c=>!old.team.some(t=>t.id===c.id));
  changes.push({id:p.id,name:p.name,oldPower,newPower,chip:acquired?.id,plateau:kantoBoard.get(p.pos).kind==='plateau'});
 }
 if(changes.length)impact=changes;
}
function impactView(){
 return (impact??[]).map(c=>'<div class="impact">'+(c.chip?img(c.chip,'impactChip'):'')+'<div><b>'+c.name+(c.chip?' recebeu '+chips[c.chip-1].name:' · Poder da equipe')+'</b><p>'+c.oldPower+' → <strong>'+c.newPower+' PP</strong> · '+(c.plateau?'No Indigo Plateau · procure a batalha final':c.newPower>=20?(c.oldPower<20?'20 PP alcançados! Siga para Cinnabar.':'Acesso ao Indigo Plateau liberado'):'Faltam '+(20-c.newPower)+' para 20')+'</p></div></div>').join('');
}
function humanAction(a,i,v){
 if(a.type==='pick')return '<button data-action="'+i+'" aria-label="'+a.label+'">'+img('starter','chipicon')+a.label+'</button>';
 let label=a.label,note='';
 if(a.type==='move'){const route=v.routes[a.route];label=placeName(route.destination);if(a.letter)label=placeName(route.destination).replace(/ \(.*\)$/,'');note=destinationInfo(v,route)+(a.letter && route.meetings.length?' · '+encountersAlong(v,a.route):'');}
 if(a.type==='attempt' && a.ball==='none')label='Rolar sem carta';
 if(a.type==='adjust'){
   const value=v.roll+a.delta;
   label='Usar '+value;
   note='Dado '+v.roll+' '+(a.delta<0?'−':'+')+' '+Math.abs(a.delta)+' · '+(v.tiles[v.target].chip.captureFaces.includes(value)?'Captura!':'Escapa');
 }
 return '<button class="btn playChoice '+(i===0?'primary':'')+'" data-action="'+i+'"><span aria-hidden="true">'+(a.letter??a.symbol??actionIcons[a.type]??'›')+'</span><b>'+label+'</b>'+(note?'<small>'+note+'</small>':'')+'</button>';
}
const arena=document.createElement('dialog');
arena.id='actionWindow';arena.setAttribute('aria-label','Painel da jogada');arena.addEventListener('cancel',ev=>{if(presentingRoll)ev.preventDefault();});document.body.append(arena);
const effects={
 'great-ball':'Antes de capturar, permite somar ou subtrair 1 do dado.',
 'ultra-ball':'Some 1 ou 2 depois de rolar.',
 'master-ball':'Some 1, 2, 3 ou 4 depois de rolar.',
 potion:'Recupera um Pokémon nocauteado da sua equipe.',
 fly:'Substitui a rolagem de movimento por um voo até a cidade escolhida.',
 'poke-doll':'Cancela um desafio ou uma troca obrigatória.',
 'time-machine':'Use somente imediatamente após um dado, seu ou de outro treinador (inclusive IA). Gaste esta carta para substituir o resultado; fora dessa janela ela apenas fica guardada na mão.',
 chance:'Receba uma ficha da cor permitida sem rolar o dado.',
 dungeon:'Escolha uma das fichas amarelas e tente capturá-la.',
 center:'Recupere um Pokémon nocauteado.',
 trade:'Troque um Pokémon elegível com outro treinador.',
 fight:'Escolha um treinador para desafiar.'
};
function description(id){
 if(id.startsWith('take-'))return 'Compre '+id.slice(-1)+' carta(s) de item.';
 if(id.startsWith('bonus-'))return 'Soma '+id.slice(-1)+' à força de ataque nesta batalha.';
 return effects[id]??'';
}
function cardOf(a){
 if(a.card)return a.card;
 if(a.ball && a.ball!=='none')return a.ball;
 return {fly:'fly',potion:'potion',reroll:'time-machine','enc-reroll':'time-machine','enc-doll':'poke-doll'}[a.type];
}
function scoreList(s){
 const line=(label,value)=>'<li><span>'+label+'</span><b>'+value+'</b></li>';
 return '<ul class="attackScore">'+line('Ataque base','+'+s.base)+line('Dado',s.die?'+'+s.die:'A rolar')+
 (s.evolution?line('Grupo evolutivo','+'+s.evolution):'')+
 s.items.map(n=>line('Carta de item','+'+n)).join('')+(s.hidden?line('Carta reservada','?'):'')+
 (s.rival?line('Bônus do Mestre','+'+s.rival):'')+
 line(s.final?'Ataque final':'Subtotal',s.total+(s.hidden?' + ?':''))+'</ul>';
}
function liveScore(v,id,species,rival){
 const e=v.encounter,index=id===v.turn?0:1;
 const resolved=state.roundScore?.find(s=>s.id===id);
 if(resolved)return scoreList({...resolved,final:true});
 const f=e.fighters.find(f=>f.playerId===id),die=e.dice[index],master=rivals.find(r=>r.name===rival);
 const base=master?.attack??species.attack,evolution=master?0:evolutionBonus(v.players[id].team,species.id,evolutionGroups);
 const items=(f?.cards??(e.actor===id && e.stage==='bonus'?e.reserved:[])??[]).map(c=>Number(c.slice(-1)));
 const extra=master&&die?master.bonusByFace[die-1]:0;
 return scoreList({base,die,evolution,items,rival:extra,hidden:f?.cardCount&&!f.cards,total:base+(die??0)+evolution+extra+items.reduce((a,b)=>a+b,0)});
}
function battleSide(v,id,rival){
 const species=rival?chips.find(c=>c.name===rivals.find(r=>r.name===rival)?.pokemon):chips[(v.encounter.choices?.[id]??0)-1];
 return '<figure data-seat="'+id+'">'+(species?img(species.id,'duelist'):'<span class="unknown">?</span>')+'<figcaption><b>'+(species?.name??'Aguardando escolha')+'</b><br>'+(rival??v.players[id]?.name??'Mestre')+'</figcaption>'+(species?liveScore(v,id,species,rival):'')+'</figure>';
}
const automaticTypes=new Set(['end','move','attempt','adjust','tie','enc-commit','enc-accept','enc-elect','enc-roll','pass','enc-pass','heal','target']);
function forced(actions){return actions.length===1 && automaticTypes.has(actions[0].type);}
const prompts={pick:'Escolha uma ficha virada para baixo.',turn:'Role o dado para iniciar seu movimento ou use um item disponível.',move:'Escolha o destino no tabuleiro ou uma das rotas listadas.',capture:'Escolha como tentar a captura.',adjust:'Escolha o ajuste da bola para resolver a captura.',heal:'Escolha qual Pokémon recuperar.',target:'Escolha uma ficha para resolver a ação.',eventTrade:'Escolha o treinador com quem trocar.',eventFight:'Escolha quem desafiar.',end:'Escolha um item ou encerre seu turno.',won:'Partida encerrada.'};
function guidance(v,actions){
 const prefix='<b>Ação</b><span>';
 const next=v.players[v.actor].name;
 const text=v.phase==='won'?v.players[v.winner].name+' venceu a partida.':
   v.actor>=state.humans?next+' (IA) · Acompanhe a jogada.':
   forced(actions)?next+' · '+actions[0].label+'.':
   next+' · '+(v.phase==='encounter'?(stages[v.encounter.stage]??'Escolha sua ação.'):(v.phase==='end'&&actions.some(a=>a.type==='discard')?'Escolha o item que vai descartar.':prompts[v.phase]??'Escolha uma das opções.'));
 return prefix+text+'</span>';
}
function lesson(v){
 if(v.encounter){
   const stage=v.encounter.stage;
   if(stage==='fighter')return 'Escolha uma ficha apta. O ataque dela será somado ao dado e aos bônus para determinar o vencedor.';
   if(stage==='bonus')return 'Você pode reservar até duas cartas de ataque. Confirmar sem carta conserva seus itens para outra batalha.';
   if(['reaction','elect-reaction'].includes(stage))return 'Mantenha o dado ou, se tiver a Máquina do Tempo, use a carta para substituir o resultado.';
   if(v.encounter.kind.includes('trade'))return 'Compare o que cada treinador entrega e recebe. Pokémon iniciais não podem ser trocados.';
   return 'O maior total vence. Em caso de empate, os dois lados lançam os dados novamente.';
 }
 return ({pick:'Cada ficha esconde um Pokémon. Depois que todos escolherem, o menor poder inicial define quem começa; empates são decididos no dado.',
 turn:'Seu objetivo é reunir pelo menos 20 pontos de poder com Pokémon aptos e vencer um Mestre no Indigo Plateau.',
 move:'Cada casa conta um passo. Compare os destinos; casas de captura oferecem Pokémon e casas de evento ativam uma carta.',
 capture:'Compare as faces indicadas na ficha. Para capturar, o dado precisa mostrar uma dessas faces. Escolha a bola antes do lançamento.',
 adjust:'A bola permite ajustar o valor do dado. Escolha um total que apareça na ficha para capturar o Pokémon.',
 heal:'Um Pokémon nocauteado não luta nem soma poder. Recuperá-lo devolve essas duas capacidades.',
 end:'Antes de encerrar, confira sua mão. Você pode manter até sete cartas ao fim do turno.',
 react:'Janela de reação: use sua Máquina do Tempo neste dado ou escolha Manter o dado para seguir. Você também pode interferir no dado da IA.',
 won:'O confronto final foi decidido. Consulte o histórico para rever as jogadas.'})[v.phase]??(prompts[v.phase]||'Confira as opções e a última jogada antes de continuar.');
}
function captureIntro(){
 const scene=arena.querySelector('.wildScene');
 if(!scene||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 scene.classList.add('wildArrival');
}
function battleIntro(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const splash=document.createElement('div');splash.className='retroIntro';
 splash.setAttribute('aria-hidden','true');
 splash.innerHTML='<div class="retroBand"></div><strong>BATALHA</strong><div class="retroBand"></div>';
 arena.prepend(splash);splash.addEventListener('animationend',ev=>{if(ev.target===splash)splash.remove();});
}
function waitForResult(ai){
 return new Promise(resolve=>{
  const button=document.createElement('button');button.className='btn primary';button.textContent='Continuar após a batalha';
  const timeout=setTimeout(finish,ai?2000:4000);
  const x=$('arenaHide');
  function finish(){clearTimeout(timeout);x.removeEventListener('click',finish);resolve();}
  x.addEventListener('click',finish);

  button.onclick=finish;arena.querySelector('.arenaChoices').append(button);button.focus();
 });
}
let aiTimer;
$('modal').addEventListener('close',()=>{if(state&&!menu&&!presentingRoll&&!$('modal').open)render();});
$('rhythm').value=rhythm;
$('rhythm').onchange=()=>{rhythm=$('rhythm').value;try{localStorage.setItem('pmt1999.rhythm',rhythm);}catch{}if(state&&!presentingRoll)render();};

function lastOutcome(){
 const row=state.journal.slice(-12).reverse().find(entry=>entry.details.length)??state.journal.at(-1);
 if(!row)return '';
 const lines=(row.details.length?row.details:[row.action]).slice(-2);
 const subject=chips.find(c=>lines.some(line=>line.includes(c.name)));
 return '<section class="lastOutcome">'+(subject?img(subject.id,'outcomeChip'):'')+'<b>O que aconteceu</b>'+lines.map(line=>'<p>'+line+'</p>').join('')+'</section>';
}
function actionWindow(v,actions,title){
 const windowState=state;
 clearTimeout(aiTimer);
 if(arena.contains($('activity')))document.querySelector('.sidecolumn').append($('activity'));
 arena.classList.toggle('victoryDialog',v.phase==='won');
 if(v.phase==='won'){
   arena.innerHTML=victoryScreen(state,colors[state.winner],img);
   $('finishReview').onclick=()=>arena.close();
   $('victoryHome').onclick=()=>{arena.close();$('tableNav').click();};
   if(!arena.open)arena.showModal();
   return;
 }
 const e=v.encounter,battle=e && ['battle','event-battle','final'].includes(e.kind);
 const cards=actions.some(a=>cardOf(a));
 const event=v.lastEvent && state.journal.at(-1)?.details.some(line=>line.startsWith('Evento:'));
 const ai=v.actor>=state.humans;
 const plan=ai && v.phase!=='won'?chooseAction(observe(state,state.actor),getLegalActions(state,state.actor),state.difficulty):null;
 const intent=plan?({'enc-bonus':'Reservar uma carta de ataque','enc-incentive':'Preparar a proposta de troca','enc-offer':'Escolher a troca','enc-fighter':'Selecionar um combatente',discard:'Descartar um item'}[plan.type]??plan.label):'';
 const rows=actions.map((a,i)=>{
   const card=cardOf(a);
   if(card)return '<button class="cardChoice" data-action="'+i+'">'+cardImg(card)+'<span><b>'+a.label+'</b><br>'+description(card)+'</span></button>';
   if(a.type==='enc-fighter'){const c=chips[a.chip-1];return '<button class="fighterChoice" data-action="'+i+'">'+img(c.id)+'<b>'+c.name+'</b><small>Ataque '+c.attack+'</small></button>';}
   return humanAction(a,i,v);
 }).join('');
 const wild=v.tiles[v.target]?.chip;
 const capture=wild && ['capture','adjust'].includes(v.phase);
 const heading=capture?(v.phase==='capture'?'Encontro selvagem':'Ajuste o dado'):v.phase==='pick'?'Escolha seu parceiro':title;
 arena.dataset.scene=battle?'battle':capture?'capture':'turn';
 arena.innerHTML='<div class="arenaTop"><span class="turnBadge">Turno '+v.number+'</span><b>'+v.players[v.actor].name+(ai?' · IA':'')+'</b><button class="pauseDesk" id="pauseDesk" aria-label="Pausar partida">Ⅱ Pausar</button><button id="arenaHide" aria-label="Fechar painel">×</button></div>'+
 '<div class="modalhead"><h2>'+heading+'</h2></div>'+
 (battle?'<div class="duel">'+battleSide(v,v.turn)+'<b aria-label="contra">VS</b>'+battleSide(v,e.opponent,e.rival)+'</div>':'')+
 (capture?'<div class="wildScene"><div class="wildPlatform">'+img(wild.id,'heroChip')+'</div><div><h3>'+wild.name+'</h3><p>Capture com</p><div class="wildFaces">'+wild.captureFaces.map(n=>'<span title="Face '+n+'" aria-label="Face '+n+'">'+dieFace(n)+'</span>').join('')+'</div></div></div>':'')+
 (event?'<div class="eventFace">'+cardImg(v.lastEvent)+'<p>'+description(v.lastEvent)+'</p></div>':'')+
 '<div class="guidance">'+guidance(v,actions)+'</div><div id="arenaDie"></div>'+
 (plan?'<p class="aiPlan"><b>Vai fazer agora</b> · '+intent+'</p>':'')+
 '<div class="arenaChoices '+(v.phase==='pick'?'openingChoices':'')+'">'+(v.phase==='won'?'<button class="btn primary" id="finishReview">Ver mesa final</button>':ai?'<button class="btn primary" id="advanceAI">Avançar jogada da IA →</button>':rows)+'</div>'+
 lastOutcome()+
 impactView()+'<details class="quickHelp"><summary>Como funciona?</summary><p>'+lesson(v)+'</p></details>'+
 '<details class="turnHistory"><summary>Histórico da mesa</summary></details>';
 $('pauseDesk').onclick=()=>{
   if(presentingRoll)return;
   clearTimeout(aiTimer);
   const snapshot=state;
   requestExit();
   $('modal').addEventListener('close',()=>{if(state===snapshot && arena.open)render();},{once:true});
 };
 if($('advanceAI'))$('advanceAI').onclick=()=>{
   if(presentingRoll || state!==windowState)return;
   dispatch(plan);
 };
 const advance=$('advanceAI');
 if(advance){
   advance.textContent='Avançar agora';
   const snapshot=state;
   aiTimer=setTimeout(()=>{if(state===snapshot && arena.open && !presentingRoll)advance.click();},['react'].includes(v.phase)||['reaction','elect-reaction'].includes(v.encounter?.stage)?900:2000);
 }
 if($('finishReview')){
   $('finishReview').onclick=()=>arena.close();
   aiTimer=setTimeout(()=>{if(arena.open && state?.phase==='won')arena.close();},ai?2000:4000);
 }
 arena.querySelector('.turnHistory').append($('activity'));
 arena.onclose=()=>{if(!arena.open && arena.contains($('activity')))document.querySelector('.sidecolumn').append($('activity'));};
 $('arenaHide').onclick=()=>{if(!presentingRoll){if(advance){advance.click();return;}document.querySelector('.sidecolumn').append($('activity'));arena.close();}};
 if(!arena.open)arena.showModal();
}
let displayedJournal=null;
function renderJournal(){
 const panel=$('activity'),list=$('messages');
 panel.hidden=!state;
 if(!state){list.replaceChildren();displayedJournal=null;return;}
 const rows=state.journal;
 const follow=list.scrollHeight-list.scrollTop-list.clientHeight<24;
 let start=0;
 if(displayedJournal?.length && rows[0]===displayedJournal[0])start=displayedJournal.length;
 else list.replaceChildren();
 if(!rows.length)list.textContent='Aguardando a escolha dos iniciais.';
 if(rows.length && !start)list.replaceChildren();
 for(const row of rows.slice(start)){
   const entry=document.createElement('article'),label=document.createElement('small'),action=document.createElement('p');
   label.textContent='Turno '+row.turn+' · '+row.actor;
   action.textContent=row.action;entry.append(label,action);
   for(const message of row.details){const line=document.createElement('p');line.textContent=message;entry.append(line);}
   list.append(entry);
 }
 displayedJournal=rows;
 if(follow)list.scrollTop=list.scrollHeight;
}
function render(){
 clearTimeout(aiTimer);
 if(state){
   const legal=getLegalActions(state,state.actor);
   if(legal.length===1 && ['pass','enc-pass','enc-commit','adjust','move'].includes(legal[0].type)){
     const snapshot=state;
     queueMicrotask(()=>{if(state===snapshot && !presentingRoll)dispatch(legal[0]);});
     return;
   }
 }

 dismissPreview();
 document.querySelector('.sidecolumn').append($('activity'));
 renderJournal();
 $('actionBar').hidden=!state;
 if(arena.open)arena.close();
 if(!state){restoreCamera();mapLayer(null,[],colors,col);lobby();return;}
 $('gameShell').dataset.screen='playing';
 const nextViewer=state.actor<state.humans?state.actor:Math.max(viewer,0);
 if(state.humans>1 && viewer!==nextViewer){
   $('actionBar').textContent='Ação · Passe o dispositivo para '+state.players[nextViewer].name+'.';
   mapLayer(null,[],colors,col);
   $('teamDock').replaceChildren();$('teamDock').hidden=true;
   $('bottom').replaceChildren();
   $('panel').innerHTML='<h2>Passe o dispositivo</h2><p>Entregue a '+state.players[nextViewer].name+' para continuar.</p><button class="btn primary wide" id="ready">Estou pronto</button>';
   const ready=()=>{viewer=nextViewer;render();};
   $('ready').onclick=ready;
   arena.innerHTML='<h2>Troca de treinador</h2><p>Passe o dispositivo para '+state.players[nextViewer].name+'. A mão deste treinador será exibida quando ele estiver pronto.</p><button class="btn primary" id="passDevice">Estou pronto</button>';
   $('passDevice').onclick=ready;arena.showModal();
   return;
 }
 const v=observe(state,viewer),actions=getLegalActions(state,viewer),p=v.players[viewer],current=v.players[v.actor];
 for(const a of actions)if(a.type==='move'){
   const route=v.routes[a.route],space=kantoBoard.get(route.destination);
   a.preview=destinationInfo(v,route);
   a.symbol=space.kind==='catch'?'◎':space.kind==='event'?'★':space.actions.includes('revive')?'✚':space.kind==='plateau'?'⚑':'◆';
 }
 const onMap=['turn','move','end'].includes(v.phase) && !v.lastEvent;
 const ai=state.actor>=state.humans;
 const mapTurn=onMap && (!ai || rhythm==='fast');

 const title=v.phase==='encounter'?(stages[v.encounter.stage]??'Encontro'):(phases[v.phase]??v.phase);
 $('actionBar').innerHTML=guidance(v,getLegalActions(state,state.actor));
 const branches=markRoutes(v,actions);
 if(branches.length && framing?.state!==state){
   restoreCamera();framing={state,zoom,x:vp.scrollLeft,y:vp.scrollTop};
   frameRoutes(v,branches,vp,$('map'),setZoom);
 }else if(!branches.length)restoreCamera();
 mapLayer(v,actions,colors,col,state.profiles?.map((p,i)=>p.sprite??i+1));
 requestAnimationFrame(()=>{if(pointer)inspect(document.elementFromPoint(...pointer));});
 const active=v.players[v.turn];
 const portrait=state.profiles?.[active.id]?.sprite??active.id+1;
 $('panel').innerHTML='<div class="trainerPlate" style="--seat:'+colors[active.id]+'"><img alt="" src="assets/trainers/'+portrait+'.png"><div><small>Turno '+v.number+'</small><h2>'+active.name+'</h2><span>'+placeName(active.pos)+'</span></div></div>'+
 (v.phase==='won'?'<button class="btn wide" id="home">Menu principal</button>':'');
 $('teamDock').hidden=false;
 $('teamDock').innerHTML='<b>Sua equipe</b><div class="dockChips">'+(p.team.map(c=>'<button data-chip="'+c.id+'" aria-label="'+c.name+(c.knockedOut?' nocauteado':'')+'">'+img(c.id,'dockChip '+(c.knockedOut?'ko':''))+'</button>').join('')||'<span>Aguardando inicial</span>')+'</div><strong>'+p.power+' <small>PP</small></strong>';
 if(mapTurn){
   const choices=ai?'<p class="hint">A IA está escolhendo sua jogada.</p>':actions.map((a,i)=>humanAction(a,i,v)).join('');
   $('panel').insertAdjacentHTML('beforeend','<h3>'+title+'</h3><div class="mapChoices">'+choices+'</div>');
   if(ai){
     const snapshot=state;aiTimer=setTimeout(()=>{if(state!==snapshot||presentingRoll||$('modal').open||arena.open)return;
       dispatch(chooseAction(observe(state,state.actor),getLegalActions(state,state.actor),state.difficulty));},rhythm==='fast'?750:2000);
   }
 }else actionWindow(v,actions,title);
 if(branches.length){
   const key='pmt1999.firstFork.'+state.seed;
   let seen=false;try{seen=!!localStorage.getItem(key);}catch{}
   if(!seen){firstFork=key+':'+state.history.length;try{localStorage.setItem(key,'1');}catch{}}
   if(firstFork===key+':'+state.history.length)$('actionBar').innerHTML='<b>Bifurcação</b><span>O dado já definiu a distância. Agora você escolhe onde quer parar.</span>';
   $('panel').insertAdjacentHTML('beforeend','<details class="forkHint"><summary>Me dá uma dica</summary><p>'+hintFor(v,branches)+'</p></details>');
 }
 if(mapTurn)$('panel').insertAdjacentHTML('beforeend',lastOutcome());
 $('panel').insertAdjacentHTML('beforeend',impactView());
 if($('home'))$('home').onclick=$('tableNav').onclick;
 const progress=document.createElement('div');progress.className='powerTrack';progress.innerHTML='<span>Poder da equipe</span><b>'+p.power+' / 20</b><progress max="20" value="'+Math.min(p.power,20)+'" aria-label="Pontos de poder"></progress>'; $('panel').querySelector('.trainerPlate').after(progress);
 const reopen=document.createElement('button');reopen.className='btn wide';reopen.textContent='Ver detalhes da jogada';reopen.onclick=()=>actionWindow(v,actions,title);$('panel').append(reopen);
 showInventory(v);
}
let rosterOwner=-1,lastObserver=-1;
function showInventory(v){
 const player=v.players[v.viewer];
 if(lastObserver!==v.viewer || !v.players[rosterOwner])rosterOwner=v.viewer;
 lastObserver=v.viewer;
 const owner=v.players[rosterOwner];
 const tabs=v.players.map(q=>'<button data-roster="'+q.id+'" aria-pressed="'+(q.id===owner.id)+'" style="--seat:'+colors[q.id]+'"><i></i>'+q.name+' <small>'+q.team.length+'</small></button>').join('');
 const collection=owner.team.map(c=>'<button class="partyCard '+(impact?.some(x=>x.id===owner.id&&x.chip===c.id)?'recentChip':'')+'" data-chip="'+c.id+'">'+img(c.id,'chipthumb '+(c.knockedOut?'ko':''))+'<b>'+c.name+'</b><small>'+(c.knockedOut?'Nocauteado':c.power+' PP · Ataque '+c.attack)+'</small></button>').join('');
 const hand=[...new Set(player.hand)].map(id=>'<button class="handCard" data-card="'+id+'">'+cardImg(id)+'<b>'+itemName(id)+'</b><small>×'+player.hand.filter(c=>c===id).length+'</small></button>').join('');
 $('bottom').innerHTML='<section class="bag"><div class="bagHead"><h3>Equipes de treinadores</h3><strong>'+owner.power+' PP</strong></div><div class="rosterTabs">'+tabs+'</div><div class="partyGrid">'+(collection||'<p class="hint">Aguardando o inicial.</p>')+'</div></section><section class="bag"><div class="bagHead"><h3>Itens de '+player.name+'</h3><strong>'+player.handSize+' itens</strong></div><div class="itemGrid">'+(hand||'<p class="hint">As cartas de item que você receber aparecem aqui.</p>')+'</div></section>';
 $('bottom').querySelectorAll('[data-roster]').forEach(b=>b.onclick=()=>{rosterOwner=Number(b.dataset.roster);showInventory(v);$('bottom').querySelector('[aria-pressed="true"]').focus({preventScroll:true});});

}
function outcomeText(before,after,action){
 const last=after.journal.at(-1);
 if(before.target && !after.target){
   const chip=before.tiles[before.target]?.id;
   if(chip)return after.players[before.turn].team.some(c=>c.id===chip)?'Capturou '+chips[chip-1].name+'!':chips[chip-1].name+' escapou!';
 }
 if(after.roundScore && before.encounter && after.roundScore!==before.roundScore && ['enc-roll','enc-pass','enc-reroll'].includes(action.type) && !before.roundScore){
   const [left,right]=after.roundScore;
   if(left.total===right.total)return 'Empate! Os dois rolam novamente.';
   const winner=left.total>right.total?left:right;
   const name=before.encounter.kind==='final' && winner.id===before.encounter.opponent?before.encounter.rival:after.players[winner.id].name;
   const other=winner===left?right:left;const loser=before.encounter.kind==='final'&&other.id===before.encounter.opponent?before.encounter.rival:after.players[other.id].name;
   return name+' ganhou! '+winner.total+' × '+other.total+' · '+loser+' perdeu.';
 }
 if(after.phase==='react'||after.encounter?.stage?.includes('reaction'))return 'Resultado provisório · Máquina do Tempo disponível.';
 if(after.phase==='adjust')return 'Escolha o ajuste da bola para saber se capturou.';
 if(before.encounter)return before.encounter.stage.startsWith('elect')?'Rolagem para escolher o Mestre.':'Ataque lançado · aguarde o outro dado.';
 if(action.type==='tie')return after.phase==='tie'?'Desempate em andamento.':after.players[after.turn].name+' começa!';
 if(after.reason==='center')return [1,6].includes(after.roll)?'Equipe recuperada!':'A recuperação não deu certo.';
 if(after.reason==='movement')return 'Movimento: '+after.roll+' passo'+(after.roll===1?'':'s')+'.';
 return last?.details.at(-1)??'';
}
async function revealStarters(s){
 if(arena.open)arena.close();
 const stage=document.createElement('dialog');stage.className='starterReveal';
 stage.setAttribute('aria-label','Revelação dos iniciais');document.body.append(stage);
 stage.addEventListener('cancel',e=>e.preventDefault());stage.showModal();
 try{
   for(const p of s.players){
     const c=chips[p.team[0].id-1];
     stage.innerHTML='<p>'+p.name+'</p><h2>'+(c.power>=5?'Excelente escolha!':c.power===4?'Ótima escolha!':'Boa escolha!')+'</h2><div class="starterPrize">'+img(c.id,'inspect')+'<h3>'+c.name+'</h3><p>Poder '+c.power+' · Ataque '+c.attack+'</p></div><button class="btn primary">Continuar</button>';
     await new Promise(resolve=>{const timer=setTimeout(resolve,p.id<s.humans?4000:2000);stage.querySelector('button').onclick=()=>{clearTimeout(timer);resolve();};});
   }
 }finally{stage.close();stage.remove();}
}
let presentingRoll = false;
async function dispatch(a){
 if(presentingRoll)return;
 clearTimeout(aiTimer);
 restoreCamera();
 const before=state;
 const attacker=state.actor;
 const trainer=state.players[attacker].name;
 const fieldRoll=a.type==='roll' && !arena.open;
 const battleOpen=arena.open && !!$('arenaDie') && !!arena.querySelector('.duel');

 state=step(state,state.actor,a);
 const rolled=state.dieResult;
 if(rolled){
   // Finish only compulsory passes and an unmodified capture before reporting the die.
   for(;;){
     const choices=getLegalActions(state,state.actor);
     if(choices.length!==1 || !['pass','enc-pass','adjust'].includes(choices[0].type))break;
     state=step(state,state.actor,choices[0]);
   }
 }
 reportImpact(before,state);
 persist();
 const battleKind=['battle','event-battle','final'];
 const newCapture=state.phase==='capture' && before.phase!=='capture';
 const opening=!before.encounter && battleKind.includes(state.encounter?.kind);
 function refreshScores(){
  const v=observe(state,viewer);
  if(!battleOpen || state.encounter?.stage==='elect')return;
  for(const figure of arena.querySelectorAll('.duel figure')){
   const id=Number(figure.dataset.seat),resolved=state.roundScore?.find(s=>s.id===id);
   if(resolved){figure.querySelector('.attackScore')?.remove();figure.insertAdjacentHTML('beforeend',scoreList({...resolved,final:true}));}
   else if(v.encounter){figure.outerHTML=battleSide(v,id,v.encounter.kind==='final'&&id===v.encounter.opponent?v.encounter.rival:null);}
  }
 }
 refreshScores();
 async function finish(){
   presentingRoll=true;
   try{if(before.phase==='pick' && state.phase!=='pick')await revealStarters(state);await travel(before,state,a,placeName,rhythm==='fast' && attacker>=before.humans);await presentItems(receivedItems(before,state),viewer,state.humans,cardImg,description,itemName);}finally{presentingRoll=false;render();if(opening && arena.open)battleIntro();if(newCapture && arena.open)captureIntro();}
 }
 const captureResolved=Boolean(before.target && !state.target && ['adjust','react'].includes(before.phase));
 const battleResolved=before.encounter && state.roundScore && (before.encounter.dice.length>0 || before.encounter.stage==='reaction') && !before.roundScore;
 if(rolled){
   presentingRoll=true;
   for(const bar of document.querySelectorAll('#actionBar,#actionWindow .guidance'))bar.innerHTML='<b>Ação</b><span>'+trainer+' · Rolando o dado…</span>';
   try {
     if(battleOpen){
       arena.querySelector('[data-seat="'+attacker+'"]')?.animate([{transform:'scale(1)'},{transform:'scale(1.13)'},{transform:'scale(1)'}],{duration:400});
       arena.querySelector('.arenaChoices').replaceChildren();
     }
     await showDie(rolled??before.encounter?.dice.at(-1)??before.roll,rolled?trainer:before.players[before.encounter?.opponent??before.turn].name,battleOpen?$('arenaDie'):fieldRoll?$('fieldDie'):undefined,rollTargets(observe(before,viewer),a),attacker>=before.humans?2000:4000,outcomeText(before,state,a),Boolean(rolled));
   }
   finally {
      if(battleOpen && before.encounter && !state.encounter){
        const lost=state.players.find(p=>p.team.some(t=>t.knockedOut && before.players[p.id].team.some(c=>c.id===t.id&&!c.knockedOut)));
        arena.querySelector('[data-seat="'+(lost?.id??before.encounter.opponent)+'"]')?.classList.add('defeated');
        arena.querySelector('.arenaChoices').textContent=state.journal.at(-1).details.join(' ');

      }
      await finish();
   }
 } else if(battleOpen && before.encounter && !state.encounter && !['move'].includes(state.phase)){
   const defeated=state.players.find(p=>p.team.some(t=>t.knockedOut && before.players[p.id].team.some(old=>old.id===t.id&&!old.knockedOut)));
   const fallen=defeated?.team.find(t=>t.knockedOut && before.players[defeated.id].team.some(old=>old.id===t.id&&!old.knockedOut));
   const result=state.winner!==undefined && state.phase==='won'?'Vitória de '+state.players[state.winner].name:fallen?chips[fallen.id-1].name+' de '+defeated.name+' foi nocauteado.':'Encontro encerrado.';
   const lost=defeated?.id??(state.phase==='won'?before.encounter.opponent:null);
   arena.querySelector('[data-seat="'+lost+'"]')?.classList.add('defeated');
   arena.querySelector('.arenaChoices').textContent=result;
   presentingRoll=true;
   await waitForResult(attacker>=before.humans);
   await finish();
 } else {await finish();}
}
document.addEventListener('click',ev=>{if(presentingRoll && $('fieldDie').childElementCount && !ev.target.closest('.diceClose')){ev.preventDefault();ev.stopImmediatePropagation();}},true);
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.chip)showChip(b.dataset.chip);
 if(b.dataset.card)modal(itemName(b.dataset.card),cardImg(b.dataset.card)+'<p>'+description(b.dataset.card)+'</p>');
 if(b.dataset.hidden)modal('Ficha oculta','<p>Esta ficha '+b.dataset.hidden+' continua virada para baixo.</p>');
 if(b.classList.contains('marker') && state && state.actor===viewer){
   const legal=getLegalActions(state,viewer),picked=legal[Number(b.dataset.action)];
   if(picked?.type==='move'){
     const dest=state.routes[picked.route].destination;
     const variants=legal.map((a,i)=>({a,i})).filter(({a})=>a.route!==undefined && state.routes[a.route].destination===dest);
     if(variants.length>1){
       const v=observe(state,viewer);markRoutes(v,legal);
       modal('Escolha o percurso',variants.map(({a,i})=>'<div class="routeVariant">'+humanAction(a,i,v)+'<small>'+encountersAlong(v,a.route)+' · '+state.routes[a.route].path.slice(1).map(placeName).join(' → ')+'</small></div>').join(''));
       for(const option of $('content').querySelectorAll('[data-action]'))option.onclick=ev=>{ev.stopPropagation();$('modal').close();dispatch(getLegalActions(state,viewer)[Number(option.dataset.action)]);};
       return;
     }
   }
 }
 if(b.dataset.action!==undefined && state && state.actor===viewer){const a=getLegalActions(state,viewer)[Number(b.dataset.action)];if(a)dispatch(a);}
});
const preview=document.createElement('div');
preview.id='inspectTip';preview.setAttribute('popover','manual');preview.setAttribute('role','tooltip');
document.body.append(preview);
let inspected=null;
let pointer=null;
document.addEventListener('pointermove',ev=>{pointer=ev.pointerType==='touch'?null:[ev.clientX,ev.clientY];},{passive:true});
function dismissPreview(){
 if(preview.matches(':popover-open'))preview.hidePopover();
 inspected=null;
}
function inspect(target){
 const node=target?.closest?.('[data-preview-chip],[data-preview-hidden],[data-chip],[data-card],[data-hidden],[data-player],.fighterChoice,.cardChoice,.cardface,.duelist,.marker,.heroChip');
 if(!node||!node.isConnected){dismissPreview();return;}
 if(inspected===node)return;
 dismissPreview();
 let html='';
 const id=node.dataset.previewChip??node.dataset.chip??(node.matches('.fighterChoice,.heroChip,.duelist')?(node.querySelector('img')??node).getAttribute('src')?.match(/chips\/(\d+)/)?.[1]:null);
 const file=(node.matches('img')?node:node.querySelector('img'))?.getAttribute('src');
 const card=node.dataset.card??Object.keys(cardFiles).find(key=>file?.endsWith('/'+cardFiles[key]+'_pt.webp'));
 if(id){const c=chips[Number(id)-1];if(c)html=img(c.id,'chipthumb')+'<div><b>'+c.name+'</b><p>Poder '+c.power+' · Ataque '+c.attack+'</p><p>'+(c.captureFaces.length?'Capture com '+c.captureFaces.join(', '):'Pokémon inicial')+'</p></div>';}
 else if(card){html=cardImg(card)+'<div><b>'+(eventTypes.find(c=>c.id===card)?.name??itemName(card))+'</b><p>'+description(card)+'</p></div>';}
 else if(node.dataset.player!==undefined && state){const p=state.players[Number(node.dataset.player)];html='<b>'+p.name+'</b><p>'+placeName(p.pos)+' · '+p.hand.length+' itens</p>';}
 else if(node.dataset.previewHidden||node.dataset.hidden){html='<b>Ficha '+(node.dataset.previewHidden??node.dataset.hidden)+'</b><p>Virada para baixo.</p>';}
 else if(node.matches('.marker'))html=node.getAttribute('aria-label');
 if(!html)return;
 inspected=node;const host=node.closest('dialog')??document.body;host.append(preview);
 preview.innerHTML=html;preview.showPopover();
 const box=node.getBoundingClientRect(),tip=preview.getBoundingClientRect();
 preview.style.left=Math.max(6,Math.min(innerWidth-tip.width-6,box.right+8))+'px';
 preview.style.top=Math.max(6,Math.min(innerHeight-tip.height-6,box.bottom+5))+'px';
}
document.addEventListener('pointerover',ev=>{if(ev.pointerType!=='touch')inspect(ev.target);});
document.addEventListener('pointerout',ev=>{if(inspected && !inspected.contains(ev.relatedTarget))dismissPreview();});
document.addEventListener('focusin',ev=>inspect(ev.target));
document.addEventListener('focusout',dismissPreview);
document.addEventListener('scroll',dismissPreview,true);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape')dismissPreview();});
render();










