// Run against BASE_URL (default: cloud dev port 5199), in isolated browser contexts.
const BASE_URL=process.env.BASE_URL||'http://127.0.0.1:5199';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE_URL+'/?preview=1');
 await page.waitForFunction(()=>document.querySelector('audio')?.readyState>=1);
 await page.locator('[data-line="0"]').click();
 await page.waitForFunction(()=>{const a=document.querySelector('audio');return a.currentTime>=22.5&&!a.paused;});
 await page.getByRole('button',{name:'暂停朗读',exact:true}).click();
 assert.equal(await page.evaluate(()=>localStorage.length),0);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:process.env.SCREENSHOT_PATH||'/tmp/elvin-mobile-listen.png'});
 await page.getByRole('button',{name:'原版阅读',exact:true}).click();
 assert.equal(await page.getByRole('spinbutton',{name:'电子书页码'}).inputValue(),'19');
 await page.getByRole('button',{name:'下一页',exact:true}).click();
 assert.equal(await page.getByRole('spinbutton',{name:'电子书页码'}).inputValue(),'20');
 await page.getByRole('combobox',{name:'书页放大'}).selectOption('1.5');
 await page.getByRole('button',{name:'同步听读',exact:true}).click();
 // Verify unavailable-text annotations and glyph images without substituting text.
 const root=require('node:path').resolve(__dirname,'../public');
 const catalog=JSON.parse(fs.readFileSync(root+'/library/catalog.json'));
 for(const id of ['v2-009','v2-034','v3-007']){
  const c=catalog.chapters.find(c=>c.id===id);
  await page.getByRole('button',{name:'打开书架',exact:true}).click();
  await page.getByRole('searchbox',{name:'搜索全部篇目'}).fill(c.title);
  await page.locator('.chapter-item').filter({hasText:c.title}).first().click();
  await page.waitForSelector('.lyrics-scroll');
  if(id==='v3-007')assert.equal(await page.locator('svg.book-glyph').count(),2);
  if(id.startsWith('v2')){assert.equal(await page.locator('.book-only').count(),1);assert.equal(await page.locator('button.book-only').count(),0);}
 }
 assert.equal(await page.evaluate(()=>localStorage.length),0);
 assert.deepEqual(errors,[]);
 console.log('PASS mobile viewport: actual AAC playback and click-to-seek, preview isolation, reader paging/zoom controls, two unspoken sentences not seekable, no horizontal overflow or JS exceptions');
 await context.close();
 const normal=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const p=await normal.newPage();await p.goto(BASE_URL+'/');
 await p.waitForFunction(()=>document.querySelector('audio')?.readyState>=1);
 await p.locator('[data-line="1"]').click();await p.waitForTimeout(250);await p.getByRole('button',{name:'暂停朗读',exact:true}).click();
 const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('elvin-reading-library-v2')));assert(saved.listening['v1-001'].position>=25);
 await p.reload();await p.waitForFunction(()=>document.querySelector('audio')?.readyState>=1);
 await p.waitForTimeout(1000);
 await p.waitForFunction(expected=>Math.abs(document.querySelector('audio').currentTime-expected)<.5,saved.listening['v1-001'].position);

 console.log('PASS normal-mode per-chapter localStorage progress restored after reload');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
