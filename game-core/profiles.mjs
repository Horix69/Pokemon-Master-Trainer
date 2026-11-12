export const swatches = {
  Azul:'#245aa6', Amarelo:'#ffce38', Vermelho:'#b33932',
  Verde:'#327847', Roxo:'#7848a6', Preto:'#151515'
};
const aiNames=['Ash','Misty','Brock','Jessie','James','Gary','Oak'];
const upper=name=>name.normalize('NFC').toLocaleUpperCase('pt-BR');
export function validateProfiles(profiles,count){
 if(!Array.isArray(profiles)||profiles.length!==count)throw Error('Quantidade de treinadores inválida.');
 const names=new Set(),colors=new Set();
 for(const {name,color,sprite} of profiles){
  if(sprite!==undefined && (!Number.isInteger(sprite)||sprite<1||sprite>10))throw Error('Personagem inválido.');
  if(typeof name!=='string'||!/^\p{L}{1,8}$/u.test(name))throw Error('Use de 1 a 8 letras no nome de cada treinador.');
  if(names.has(upper(name)))throw Error('Escolha nomes diferentes para os treinadores.');
  if(!Object.hasOwn(swatches,color)||colors.has(color))throw Error('Escolha uma cor diferente para cada treinador.');
  names.add(upper(name)); colors.add(color);
 }
}
export function completeProfiles(locals,count){
 validateProfiles(locals,locals.length);
 const names=aiNames.filter(n=>!locals.some(p=>upper(n)===upper(p.name)));
 const colors=Object.keys(swatches).filter(c=>!locals.some(p=>p.color===c));
 const sprites=Array.from({length:9},(_,i)=>i+1).filter(id=>!locals.some(p=>p.sprite===id));
 const draw=pool=>pool.splice(Math.floor(Math.random()*pool.length),1)[0];
 return [...locals,...Array.from({length:count-locals.length},()=>({name:draw(names),color:draw(colors),sprite:draw(sprites)}))];
}
