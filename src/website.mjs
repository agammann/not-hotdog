import {classifyImage,resetEngine} from './device-client.mjs';
import {setupHosted} from './hosted-ui.mjs';
let enabled=false, busy=false, timer, generation=0;
const cache=new Map();
const status=document.querySelector('#status'), enable=document.querySelector('#enable');
const hosted=setupHosted({prepareImage:imageData,stopDevice(){cancel();enabled=false;enable.setAttribute('aria-pressed','false');enable.textContent='Enable hover';}});
async function imageData(image){
  if(!image.complete||!image.naturalWidth)await image.decode();
  if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>16_000_000)throw Error('Choose an image with at most 16 million pixels.');
  const canvas=document.createElement('canvas');const ratio=Math.min(1,768/Math.max(image.naturalWidth,image.naturalHeight));
  canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.85);
}
async function run(card){
  if(hosted.active()){hosted.select(card);return;}
  if(!enabled){status.textContent='Enable hover first. Images stay on this device.';return;}
  const img=card.querySelector('img'),label=card.querySelector('.verdict'), key=img.src, current=generation;
  if(cache.has(key)){const r=cache.get(key);label.textContent=r.verdict;card.dataset.verdict=r.verdict;status.textContent=r.message;return;}
  if(busy){status.textContent='One image at a time. Try this one when the current verdict is ready.';return;}
  busy=true;card.setAttribute('aria-busy','true');label.textContent='A MOMENT OF FRANKNESS…';status.textContent='Checking on this device. First use loads the local model…';
  try{
    const image=await imageData(img);
    if(current!==generation)return;
    const result=await classifyImage(image);
    if(current!==generation)return;cache.set(key,result);label.textContent=result.verdict;card.dataset.verdict=result.verdict;status.textContent=result.message;
  }catch(e){if(current===generation){label.textContent='TRY AGAIN';status.textContent=e.message||'This image could not be read.';}}
  finally{if(current===generation){busy=false;card.removeAttribute('aria-busy');}}
}
function bind(card){card.addEventListener('mouseenter',()=>{if(enabled)timer=setTimeout(()=>run(card),650);});card.addEventListener('mouseleave',()=>clearTimeout(timer));card.addEventListener('click',()=>{clearTimeout(timer);run(card);});}
document.querySelectorAll('.image-card').forEach(bind);
function cancel(){clearTimeout(timer);generation++;busy=false;resetEngine();document.querySelectorAll('.image-card').forEach(c=>{c.removeAttribute('aria-busy');if(!c.dataset.verdict)c.querySelector('.verdict').textContent='HOVER TO FIND OUT';});}
enable.addEventListener('click',()=>{enabled=!enabled;enable.setAttribute('aria-pressed',String(enabled));enable.textContent=enabled?'Pause hover':'Enable hover';status.textContent=enabled?'Hover over an image, or click it.':'Hover paused.';if(!enabled)cancel();});
document.querySelector('#clear').addEventListener('click',()=>{cancel();cache.clear();document.querySelectorAll('.image-card').forEach(c=>{delete c.dataset.verdict;c.querySelector('.verdict').textContent='HOVER TO FIND OUT';});hosted.clearSelection();status.textContent='A clean slate.';});
document.querySelector('#upload').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>12_000_000){status.textContent='Choose a PNG, JPEG, or WebP image smaller than 12 MB.';e.target.value='';return;}
  cancel();hosted.clearSelection();
  const old=document.querySelector('[data-upload]');if(old){cache.delete(old.querySelector('img').src);URL.revokeObjectURL(old.querySelector('img').src);old.remove();}
  const card=document.createElement('button');card.className='image-card';card.dataset.upload='true';card.setAttribute('aria-label','Classify your selected image');
  const title=document.createElement('span');title.className='card-title';title.textContent='03 / YOUR WILD CARD';
  const img=document.createElement('img');img.src=URL.createObjectURL(file);img.alt='Your selected image';const label=document.createElement('span');label.className='verdict';label.textContent='HOVER TO FIND OUT';card.append(title,img,label);document.querySelector('.gallery').append(card);bind(card);hosted.select(card);status.textContent=hosted.active()?'Your image is selected. Choose Send selected image for a hosted check.':enabled?'Your image is ready. Hover or click for a verdict.':'Your image is ready. Enable hover, then point or click.';card.scrollIntoView({block:'nearest'});e.target.value='';
});

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&enabled)enable.click();});
