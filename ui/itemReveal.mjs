// Multiset difference preserves duplicate cards and excludes cards merely retained.
export function receivedItems(before, after) {
  return after.players.flatMap(p=>{
    const remaining=[...before.players[p.id].hand];
    const cards=p.hand.filter(card=>{const i=remaining.indexOf(card);if(i<0)return true;remaining.splice(i,1);return false;});
    return cards.length?[{id:p.id,name:p.name,cards}]:[];
  });
}
export async function presentItems(receipts, viewer, humans, cardImg, description, itemName) {
  for(const receipt of receipts){
    const own=receipt.id===viewer && receipt.id<humans;
    const dialog=document.createElement('dialog');dialog.className='itemReveal';
    dialog.setAttribute('aria-label','Itens recebidos');
    dialog.innerHTML='<button class="receiptClose" aria-label="Fechar itens recebidos">×</button><small>NOVOS ITENS</small><h2>'+receipt.name+' recebeu '+receipt.cards.length+' carta(s)</h2><p>'+(own?'Seus novos recursos para a aventura.':'As cartas ficam na mão privada deste treinador.')+'</p><div class="receiptCards">'+receipt.cards.map((id,i)=>'<article style="--order:'+i+'">'+(own?cardImg(id)+'<h3>'+itemName(id)+'</h3><p>'+description(id)+'</p>':'<div class="cardBack" aria-label="Carta oculta">◆</div>')+'</article>').join('')+'</div><button class="btn primary receiptContinue">Continuar →</button>';
    document.body.append(dialog);dialog.showModal();
    await new Promise(resolve=>{
      let timer,finished=false;
      const finish=()=>{if(finished)return;finished=true;clearTimeout(timer);dialog.remove();resolve();};
      dialog.addEventListener('close',finish,{once:true});
      dialog.querySelector('.receiptClose').onclick=finish;
      dialog.querySelector('.receiptContinue').onclick=finish;
      dialog.addEventListener('cancel',e=>{e.preventDefault();finish();},{once:true});
      if(!own)timer=setTimeout(finish,2000);
    });
  }
}
