import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {hostedMessages} from '../src/hosted-contract.mjs';

async function harness(){
  const dom=new JSDOM(await fs.readFile('public/index.html','utf8'),{url:'http://localhost',runScripts:'outside-only'});
  const w=dom.window, calls=[], hostedCalls=[];
  w.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){}});
  w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,AAAA';
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.HTMLImageElement.prototype.decode=async()=>{};
  Object.defineProperty(w.HTMLImageElement.prototype,'naturalWidth',{get:()=>600});
  Object.defineProperty(w.HTMLImageElement.prototype,'naturalHeight',{get:()=>400});
  w.classifyImage=()=>new Promise((resolve,reject)=>calls.push({resolve,reject}));
  w.resetEngine=()=>{};
  w.classifyHosted=(image,options)=>new Promise((resolve,reject)=>hostedCalls.push({image,options,resolve,reject}));
  w.hostedMessages=hostedMessages;
  w.eval((await fs.readFile('src/hosted-ui.mjs','utf8')).replace(/^import[^\n]+\n/gm,'').replace('export function setupHosted','function setupHosted'));
  w.eval((await fs.readFile('src/website.mjs','utf8')).replace(/^import[^\n]+\n/gm,''));
  return {w,calls,hostedCalls,dom,button:s=>w.document.querySelector(s)};
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

test('clear cancels a pending verdict and its completion cannot unlock a newer check',async()=>{
  const h=await harness();
  try{
    h.button('#enable').click(); h.button('.image-card').click(); await tick();
    assert.equal(h.calls.length,1);
    h.button('#clear').click();
    assert.equal(h.button('.image-card').hasAttribute('aria-busy'),false);
    h.button('.image-card').click(); await tick();
    assert.equal(h.calls.length,2);
    h.calls[0].resolve({verdict:'NOT HOTDOG',message:'stale'});await tick();
    assert.equal(h.button('.image-card').getAttribute('aria-busy'),'true');
    assert.equal(h.button('.image-card').dataset.verdict,undefined);
    h.button('[data-sample="banana.jpg"]').click();await tick();
    assert.equal(h.calls.length,2);
    h.calls[1].resolve({verdict:'HOTDOG',message:'Fresh verdict'});await tick();
    assert.equal(h.button('.image-card').dataset.verdict,'HOTDOG');
    assert.equal(h.button('.image-card').hasAttribute('aria-busy'),false);
  }finally{h.dom.window.close();}
});

test('Escape pauses classification, removes the spinner, and drops late results',async()=>{
  const h=await harness();
  try{
    h.button('#enable').click();h.button('.image-card').click();await tick();
    h.w.document.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Escape'}));
    assert.equal(h.button('#enable').getAttribute('aria-pressed'),'false');
    assert.equal(h.button('.image-card').hasAttribute('aria-busy'),false);
    h.calls[0].resolve({verdict:'HOTDOG',message:'late'});await tick();
    assert.equal(h.button('.image-card').dataset.verdict,undefined);
    assert.equal(h.button('#status').textContent,'Hover paused.');
  }finally{h.dom.window.close();}
});

test('invalid uploads are rejected and replacing an image revokes its local URL',async()=>{
  const h=await harness(); let id=0; const revoked=[];
  try{
    h.w.URL.createObjectURL=()=>`blob:local-${++id}`;
    h.w.URL.revokeObjectURL=url=>revoked.push(url);
    const input=h.button('#upload');
    function upload(type,size){Object.defineProperty(input,'files',{configurable:true,value:[{type,size}]});input.dispatchEvent(new h.w.Event('change'));}
    upload('text/html',100);assert.equal(h.button('[data-upload]'),null);
    upload('image/png',12000001);assert.equal(h.button('[data-upload]'),null);
    upload('image/png',100);assert.equal(h.button('[data-upload] .card-title').textContent,'03 / YOUR WILD CARD');
    upload('image/jpeg',100);assert.equal(h.w.document.querySelectorAll('[data-upload]').length,1);
    assert.deepEqual(revoked,['blob:local-1']);
  }finally{h.dom.window.close();}
});

test('hosted selection is inert until Send, and replacing the selection drops a late answer',async()=>{
  const h=await harness();
  try{
    const mode=h.button('#check-mode');mode.value='hosted';mode.dispatchEvent(new h.w.Event('change'));
    h.button('#visitor-key').value='test-key';h.button('.image-card').click();await tick();
    assert.equal(h.calls.length,0);assert.equal(h.hostedCalls.length,0);
    h.button('#hosted-check').click();await tick();assert.equal(h.hostedCalls.length,1);
    h.button('[data-sample="banana.jpg"]').click();
    assert.equal(h.hostedCalls[0].options.signal.aborted,true);
    h.hostedCalls[0].resolve({value:{verdict:'HOTDOG',reason:'Stale'},model:'gpt-5.4'});await tick();
    assert.equal(h.button('#hosted-result').hidden,true);
    h.button('#hosted-check').click();await tick();
    h.hostedCalls[1].resolve({value:{verdict:'NOT HOTDOG',reason:'<script>not executable</script>'},model:'gpt-5.4'});await tick();
    assert.equal(h.button('#hosted-result script'),null);assert.equal(h.button('#hosted-result').textContent.includes('not executable'),false);
    assert.match(h.button('#hosted-result').textContent,/The hosted model did not identify a sausage in a split bun/);
    assert.equal(h.button('.image-card').dataset.verdict,undefined);
  }finally{h.dom.window.close();}
});

test('clear, device mode, and pagehide forget the key and abort hosted work',async()=>{
  for(const action of ['clear','device','pagehide']){
    const h=await harness();
    try{
      const mode=h.button('#check-mode');mode.value='hosted';mode.dispatchEvent(new h.w.Event('change'));
      h.button('#visitor-key').value='temporary-key';h.button('.image-card').click();h.button('#hosted-check').click();await tick();
      if(action==='clear')h.button('#clear').click();
      else if(action==='device'){mode.value='device';mode.dispatchEvent(new h.w.Event('change'));}
      else h.w.dispatchEvent(new h.w.PageTransitionEvent('pagehide',{persisted:true}));
      assert.equal(h.button('#visitor-key').value,'');assert.equal(h.hostedCalls[0].options.signal.aborted,true);
      h.hostedCalls[0].resolve({value:{verdict:'HOTDOG',reason:'Late'},model:'gpt-5.4'});await tick();
      assert.equal(h.button('#hosted-result').hidden,true);assert.equal(h.button('#hosted-check').disabled,true);
      assert.equal(h.w.localStorage.length,0);assert.equal(h.w.sessionStorage.length,0);
    }finally{h.dom.window.close();}
  }
});
