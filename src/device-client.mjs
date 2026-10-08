let worker,serial=0;const pending=new Map();
export function classifyImage(image){
  if(!worker){worker=new Worker('/device-worker.js?v=1.0.0',{type:'module'});worker.onmessage=({data})=>{const task=pending.get(data.id);if(!task)return;pending.delete(data.id);clearTimeout(task.timer);data.error?task.reject(Error(data.error)):task.resolve(data.result);};worker.onerror=()=>resetEngine();}
  return new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>resetEngine(),60000);pending.set(id,{resolve,reject,timer});worker.postMessage({id,type:'classify',image});});
}
export function resetEngine(){worker?.terminate();worker=null;for(const task of pending.values()){clearTimeout(task.timer);task.reject(Error('Check stopped.'));}pending.clear();}
