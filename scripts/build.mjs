import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {zipSync} from 'fflate';
const common={bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true};
await build({...common,entryPoints:['src/website.mjs'],outfile:'public/app.js'});
await build({...common,entryPoints:['src/device-worker.mjs'],outfile:'public/device-worker.js'});
await build({...common,entryPoints:['src/extension-background.mjs'],outfile:'extension/background.js'});
await fs.cp('public/model','extension/model',{recursive:true});
await fs.copyFile('MODEL.lock.json','extension/MODEL.lock.json');
const packed={};
async function zipWalk(dir,prefix=''){for(const e of await fs.readdir(dir,{withFileTypes:true})){const name=prefix+e.name;if(e.isDirectory())await zipWalk(path.join(dir,e.name),name+'/');else packed[name]=new Uint8Array(await fs.readFile(path.join(dir,e.name)));}}
await zipWalk('extension');
await fs.writeFile('public/not-hotdog-extension.zip',zipSync(packed,{level:6}));
const assets={},types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.bin':'application/octet-stream','.zip':'application/zip','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
async function walk(dir,prefix=''){for(const e of await fs.readdir(dir,{withFileTypes:true})){const name=prefix+'/'+e.name;if(e.isDirectory())await walk(path.join(dir,e.name),name);else assets[name]={type:types[path.extname(e.name)]||'application/octet-stream',data:(await fs.readFile(path.join(dir,e.name))).toString('base64')};}}
await walk('public');await fs.writeFile('src/assets.generated.mjs',`export const assets=${JSON.stringify(assets)};\n`);
await fs.mkdir('dist/server',{recursive:true});await build({...common,entryPoints:['src/worker.mjs'],outfile:'dist/server/index.js'});
await fs.mkdir('dist/.openai',{recursive:true});await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built device website, local extension, and optional visitor-key Worker. No build-time API credential is used.');
