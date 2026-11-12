const orientations = [[0,0],[-90,0],[90,0],[0,-90],[0,90],[0,180]];
const popup = document.createElement('dialog');
popup.className = 'dice-popup';
popup.setAttribute('aria-label','Rolagem de dado');
popup.innerHTML = '<div class="dice-scene"><div class="dice-cube" aria-hidden="true"></div></div><strong role="status"></strong>';
document.body.append(popup);
popup.addEventListener('cancel', event => event.preventDefault());
const cube = popup.querySelector<HTMLElement>('.dice-cube')!;
const result = popup.querySelector('strong')!;
orientations.forEach(([x,y],index)=>{
  const face = document.createElement('span');
  face.textContent = String(index+1);
  face.style.transform = 'rotateY('+(-y)+'deg) rotateX('+(-x)+'deg) translateZ(50px)';
  cube.append(face);
});
export async function showDie(face:number, trainer:string, host?:HTMLElement, goals:{label:string;faces:number[]}[]=[], delay=4000, outcome="", animate=true) {
  const [x,y] = orientations[face-1];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finish = 'rotateX('+(720+x)+'deg) rotateY('+(720+y)+'deg)';
  result.textContent = trainer+' · Rolando…';
  const scene=cube.parentElement!;
  const close=document.createElement('button');
  close.className='diceClose';close.textContent='×';close.setAttribute('aria-label','Fechar resultado do dado');
  const container=host??popup;
  if(host)host.append(scene,result);else popup.showModal();
  const guide=document.createElement('section');
  guide.className='rollGoals';
  const symbols=['⚀','⚁','⚂','⚃','⚄','⚅'];
  for(const group of goals){
    const caption=document.createElement('p');caption.textContent=group.label;guide.append(caption);
    for(const face of group.faces){
      const pip=document.createElement('span');pip.textContent=symbols[face-1];
      pip.setAttribute('aria-label','Face '+face);pip.title='Face '+face;guide.append(pip);
    }
  }
  container.append(guide);
  container.prepend(close);

  let spin:Animation|undefined;
  let dismissed=false;
  let done!:()=>void;
  const early=new Promise<void>(resolve=>{done=resolve;});
  close.onclick=()=>{dismissed=true;done();};
  try {
    cube.style.transform=finish;
    if(!reduced && animate){
      spin=cube.animate([{transform:'rotateX(0deg) rotateY(0deg)'},{transform:finish}],{duration:1100,easing:'cubic-bezier(.2,.8,.3,1)'});
      await Promise.race([spin.finished,early]);
    }
    result.textContent=trainer+' · Dado '+face;
    const message=document.createElement('p');message.className='dieOutcome';message.textContent=outcome;
    const countdown=document.createElement('span');countdown.className='diceCount';countdown.setAttribute('aria-label','Contagem regressiva');
    guide.prepend(message);container.append(countdown);
    const deadline=performance.now()+delay;
    const tick=()=>{countdown.textContent=String(Math.max(1,Math.ceil((deadline-performance.now())/1000)));};
    tick();
    const clock=window.setInterval(tick,100);
    const timeout=window.setTimeout(done,delay);
    try{if(!dismissed)await early;}finally{clearTimeout(timeout);clearInterval(clock);countdown.remove();}
  } finally {
    spin?.cancel();close.remove();guide.remove();
    if(host)popup.append(scene,result);else popup.close();
  }
}

