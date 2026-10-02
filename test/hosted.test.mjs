import test from 'node:test';
import assert from 'node:assert/strict';
import {visitorClassify} from '../src/visitor-classify.mjs';
import {classifyHosted} from '../src/hosted-client.mjs';
import {validateHostedImage, validateHostedVerdict} from '../src/hosted-contract.mjs';

const key = 'sk-' + 'unit'.repeat(8);
// Minimal JPEG header fixture: transport validation only, never sent to a provider.
const jpeg = (width = 16, height = 16) => 'data:image/jpeg;base64,' + Buffer.from([255,216,255,192,0,8,8,height>>8,height&255,width>>8,width&255,1,255,217]).toString('base64');
const request = (data = {image:jpeg(),model:'gpt-5.4'}, headers = {}, signal) => new Request('https://unit.example/api/classify/visitor', {method:'POST',signal,headers:{Origin:'https://unit.example',Authorization:`Bearer ${key}`,'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
const completion = (value = {verdict:'HOTDOG'}) => Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});

test('visitor route forwards one bounded image only to the fixed provider using the supplied key', async () => {
  let calls = 0;
  const response = await visitorClassify(request(), {fetchImpl:async (url, options) => {
    calls++; assert.equal(url,'https://api.openai.com/v1/responses'); assert.equal(options.redirect,'manual');
    assert.equal(options.headers.Authorization,`Bearer ${key}`);
    const body = JSON.parse(options.body); assert.equal(body.store,false); assert.equal(body.model,'gpt-5.4'); assert.equal(body.max_output_tokens,500);
    assert.equal(body.input[0].content[1].image_url,jpeg()); assert.equal(body.input[0].content[1].detail,'high');
    assert.equal(options.body.includes(key),false); assert.equal(body.tools,undefined);
    return completion();
  }});
  assert.equal(calls,1); assert.equal(response.status,200); assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.deepEqual(await response.json(),{value:{verdict:'HOTDOG'},model:'gpt-5.4'});
});

test('invalid key, origin, model, raster dimensions and body bounds never reach the provider', async () => {
  const fetchImpl = async () => { throw Error('Unexpected provider request'); };
  const cases = [
    [request(undefined,{Authorization:''}),401], [request(undefined,{Origin:'https://elsewhere.example'}),403],
    [request({image:jpeg(),model:'unsupported'}),400], [request({image:'https://image.example/a.jpg',model:'gpt-5.4'}),400],
    [request({image:jpeg(769),model:'gpt-5.4'}),400], [request({image:jpeg(),model:'gpt-5.4',apiKey:key}),400],
    [request({image:'x'.repeat(2_010_001),model:'gpt-5.4'}),413],
  ];
  for (const [input,status] of cases) assert.equal((await visitorClassify(input,{fetchImpl})).status,status);
  assert.throws(()=>validateHostedImage('data:image/jpeg;base64,AAAA'));
  assert.throws(()=>validateHostedVerdict({verdict:'MAYBE',reason:'Guess'}));
  assert.throws(()=>validateHostedVerdict({verdict:'HOTDOG',reason:'A bun',confidence:.99}));
  assert.throws(()=>validateHostedVerdict({verdict:'HOTDOG',reason:'A made-up ingredient'}));
});

test('provider errors, incomplete output and refused or invalid verdicts are errors, never NOT HOTDOG', async () => {
  for (const status of [401,403,404,429,500,302]) {
    const response = await visitorClassify(request(),{fetchImpl:async()=>new Response(key,{status})});
    assert.equal(response.ok,false); const body = await response.json(); assert.equal(body.error.includes(key),false); assert.equal(body.value,undefined);
  }
  for (const fixture of [
    {status:'incomplete',output:[]},
    {status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'no'}]}]},
    {status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{}'}]}]},
  ]) assert.equal((await visitorClassify(request(),{fetchImpl:async()=>Response.json(fixture)})).ok,false);
  assert.equal((await visitorClassify(request(),{fetchImpl:async()=>completion({verdict:'HOTDOG',reason:key})})).status,502);
});

test('canceling while the provider body is pending returns a canceled request', async () => {
  const controller = new AbortController(); let canceled = false;
  const response = await visitorClassify(request(undefined,{},controller.signal),{fetchImpl:async()=>{
    queueMicrotask(()=>controller.abort());
    return new Response(new ReadableStream({cancel(){canceled=true;}}));
  }});
  assert.equal(response.status,499); assert.equal(canceled,true);
});

test('client uses the visitor route, omits cookies and rejects stale or malformed responses', async () => {
  const before = globalThis.fetch;
  try {
    let calls=0;
    globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'/api/classify/visitor');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');return Response.json({model:'gpt-5.4',value:{verdict:'UNCERTAIN'}});};
    assert.equal((await classifyHosted(jpeg(),{apiKey:key})).value.verdict,'UNCERTAIN');assert.equal(calls,1);
    await assert.rejects(classifyHosted(jpeg(),{apiKey:''}),/own OpenAI/);assert.equal(calls,1);
    const controller=new AbortController();
    globalThis.fetch=async()=>({ok:true,json:async()=>{controller.abort();throw new DOMException('Canceled','AbortError');}});
    await assert.rejects(classifyHosted(jpeg(),{apiKey:key,signal:controller.signal}),{name:'AbortError'});
    globalThis.fetch=async()=>Response.json({model:'other',value:{verdict:'HOTDOG',reason:'A bun'}});
    await assert.rejects(classifyHosted(jpeg(),{apiKey:key}),/unexpected model/);
  } finally { globalThis.fetch=before; }
});
