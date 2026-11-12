import { createRequire } from 'node:module';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const { chromium }=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const profile=await mkdtemp(join(tmpdir(),'master-trainer-qa-'));
const launch=()=>chromium.launchPersistentContext(profile,{headless:true,executablePath:process.env.BROWSER_BIN||undefined,viewport:{width:390,height:844}});
const url=new URL('../index.html',import.meta.url).href;
let context;
try{
 context=await launch();let page=await context.newPage();await page.goto(url);await page.locator('#singleplayer').click();
 await page.locator('#start').click();await page.locator('#actionWindow [data-action="0"]').click();
 await page.locator('#pauseDesk').click();await page.locator('#saveExit').click();
 const raw=await page.evaluate(()=>localStorage.getItem('pmt1999.game.v1'));
 assert.ok(JSON.parse(raw).history.length>=1);
 await context.close();context=await launch();page=await context.newPage();await page.goto(url);await page.locator('#singleplayer').click();
 await page.locator('#resume').waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('pmt1999.game.v1')),raw);
 await page.locator('#resume').click();await page.locator('#panel h2').waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('Salvamento recuperado após fechar e reabrir o navegador; layout verificado a 390 px.');
}finally{if(context)await context.close();await rm(profile,{recursive:true,force:true});}

