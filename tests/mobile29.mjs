import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const b=await chromium.launch({executablePath:process.env.BROWSER_BIN||undefined});
try{for(const [width,height,scale] of [[1360,850,1],[305,678,4],[678,305,4]]){
 const p=await b.newPage({viewport:{width,height},deviceScaleFactor:scale,isMobile:scale>1,hasTouch:scale>1});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(new URL('../index.html',import.meta.url).href);
 assert.ok(await p.locator('#singleplayer').isVisible());
 if(width===1360)await p.screenshot({path:'../../work/menu29.png'});
 await p.locator('#multiplayer').click();await p.locator('#humans').selectOption('2');await p.locator('#count').selectOption('0');
 assert.equal(await p.locator('.identity').first().locator('.spriteGrid img').count(),9);
 await p.locator('.identity').first().locator('.spriteGrid label').nth(6).click();
 await p.locator('#start').click();await p.locator('#actionWindow [data-action]').first().click();await p.locator('#passDevice').click();await p.locator('#actionWindow [data-action]').first().click();
 await p.locator('.starterReveal button').first().click();await p.locator('.starterReveal button').first().click();

 if(await p.locator('#passDevice').isVisible())await p.locator('#passDevice').click();
 await p.locator('.rosterTabs button').first().waitFor({state:'attached'});assert.equal(await p.locator('.rosterTabs button').count(),2);
 if(await p.locator('#arenaHide').isVisible())await p.locator('#arenaHide').click();
 await p.locator('.rosterTabs button').last().click();assert.ok(await p.locator('.partyGrid .partyCard').count());
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.deepEqual(errors,[]);console.log('OK',width*scale,height*scale);await p.close();
}}finally{await b.close()}

