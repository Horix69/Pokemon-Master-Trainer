import {createRequire} from 'node:module';import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {transform} from 'esbuild';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER_BIN});
try{
 const page=await browser.newPage({viewport:{width:1000,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('../index.html',import.meta.url).href);
 const code=(await transform((await readFile(new URL('../ui/dice.ts',import.meta.url),'utf8')).replace('export async function showDie','window.testDie = async function showDie'),{loader:'ts'})).code;
 await page.addScriptTag({content:code});
 for(const during of [50,1300]){
  await page.evaluate(()=>{window.dieDone=false;window.testDie(5,'Teste').then(()=>window.dieDone=true)});
  await page.waitForTimeout(during);await page.locator('.diceClose').click();
  await page.waitForFunction(()=>window.dieDone);assert.equal(await page.locator('.dice-popup[open]').count(),0);
  await page.waitForTimeout(4100);assert.equal(await page.locator('.diceClose').count(),0);
 }
 let receipt=(await readFile(new URL('../ui/itemReveal.mjs',import.meta.url),'utf8')).replace('export function receivedItems','function receivedItems').replace('export async function presentItems','window.testItems = async function presentItems');
 await page.addScriptTag({content:receipt});
 await page.evaluate(()=>{window.testItems([{id:0,name:'Ana',cards:['TimeMachine_Item','Potion_Item']}],0,1,id=>'<img class="cardface" src="assets/cards/'+id+'_pt.webp">',id=>id==='TimeMachine_Item'?'Repita um dado imediatamente após a rolagem.':'Reviva um Pokémon nocauteado.',id=>id==='TimeMachine_Item'?'Máquina do Tempo':'Poção');});
 await page.waitForTimeout(900);await page.screenshot({path:'../../work/items30.png'});
 await page.locator('.receiptContinue').click();assert.equal(await page.locator('.itemReveal').count(),0);
 await page.evaluate(()=>{window.receiptDone=false;window.testItems([{id:0,name:'Ana',cards:['potion']}],0,1,()=>'',()=>'',()=> 'Poção').then(()=>window.receiptDone=true);});
 await page.evaluate(()=>document.querySelector('.itemReveal').close());
 await page.waitForFunction(()=>window.receiptDone);
 assert.equal(await page.locator('.itemReveal').count(),0);
 assert.deepEqual(errors,[]);console.log('Dado: X durante e após animação encerra e não reabre; recebimento: cartas e fechamento OK');
}finally{await browser.close()}

