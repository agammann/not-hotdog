import {assets} from './assets.generated.mjs';
import {visitorClassify} from './visitor-classify.mjs';
export default {async fetch(request){
 const url=new URL(request.url);
 if(url.pathname==='/api/classify/visitor')return visitorClassify(request);
 const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self' data:; worker-src 'self'; frame-ancestors 'none'"};
 if(url.pathname==='/health')return new Response(JSON.stringify({status:'ready',inference:'on_device',optional_hosted:'visitor_key',publisher_api:false}),{headers:{...headers,'Content-Type':'application/json'}});
 if(url.pathname==='/api/classify'||url.pathname==='/mcp')return new Response(JSON.stringify({error:'This endpoint is retired. Use the website or local browser companion.'}),{status:410,headers:{...headers,'Content-Type':'application/json'}});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers});
 const key=url.pathname==='/'?'/index.html':url.pathname;
 const file=assets[key]||assets[key+'.html'];if(!file)return new Response('Not found',{status:404,headers});
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(file.data),c=>c.charCodeAt(0)),{headers:{...headers,'Content-Type':file.type,'Cache-Control':'public, max-age=300'}});
}};
