import http from 'node:http';
import worker from './worker.mjs';
const port=Number(process.env.PORT)||4317;
http.createServer(async(req,res)=>{
  try{
    if(!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host)){res.writeHead(403);res.end();return;}
    const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
    const request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers:req.headers,signal:controller.signal,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});
    const response=await worker.fetch(request);
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500);res.end('Request failed');}
}).listen(port,'127.0.0.1',()=>console.log(`not hotdog: http://127.0.0.1:${port}`));
