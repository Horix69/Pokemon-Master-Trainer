const music = document.querySelector<HTMLAudioElement>('#music')!;
const toggle = document.querySelector<HTMLButtonElement>('#musicToggle')!;
const status = document.querySelector<HTMLElement>('#musicStatus')!;
function syncMusicButton() {
  toggle.textContent = music.paused ? '▶ Tocar música' : 'Ⅱ Pausar música';
}
music.addEventListener('play', syncMusicButton);
music.addEventListener('pause', syncMusicButton);
toggle.addEventListener('click', async () => {
  status.textContent = '';
  if (!music.paused) {
    music.pause();
    return;
  }
  try {
    await music.play();
  } catch {
    status.textContent = 'Não foi possível tocar a música.';
  }
});
export {};
let level=30;
function volume(delta:number){
 level=Math.max(0,Math.min(100,level+delta));
 music.volume=level/100;
 document.getElementById('volume')!.textContent=level+'%';
}
volume(0);
document.getElementById('volDown')!.onclick=()=>volume(-5);
document.getElementById('volUp')!.onclick=()=>volume(5);
music.play().catch(()=>document.addEventListener('click',event=>{
 if(event.target!==toggle)music.play().catch(()=>{});
},{once:true,capture:true}));
