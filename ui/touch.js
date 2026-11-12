// Long press opens the same public inspection used by keyboard focus on desktop.
let press, origin, inspectedTouch;
const clearPress=()=>clearTimeout(press);
document.addEventListener('pointerdown',event=>{
  clearPress(); inspectedTouch=null;
  if(event.pointerType!=='touch')return;
  const target=event.target.closest('[data-preview-chip],[data-preview-hidden],[data-chip],[data-card],[data-hidden],[data-player],.fighterChoice,.cardChoice,.cardface,.duelist,.heroChip');
  if(!target)return;
  origin=[event.clientX,event.clientY];
  press=setTimeout(()=>{
    if(!target.isConnected)return;
    inspectedTouch=target;
    target.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));
  },500);
},{passive:true});
document.addEventListener('pointermove',event=>{
  if(origin && Math.hypot(event.clientX-origin[0],event.clientY-origin[1])>10)clearPress();
},{passive:true});
for(const type of ['pointerup','pointercancel','scroll'])document.addEventListener(type,clearPress,true);
document.addEventListener('click',event=>{
  if(inspectedTouch && inspectedTouch.contains(event.target)){
    event.preventDefault();event.stopImmediatePropagation();inspectedTouch=null;
  }
},true);
