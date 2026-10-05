export async function trackPropertyEvent(eventName:string, data:Record<string,unknown>={}) {
  try {
    const key='property-vision-session';
    const existing=typeof window!=='undefined'?localStorage.getItem(key):null;
    const sessionId=existing||crypto.randomUUID();
    if(typeof window!=='undefined'&&!existing)localStorage.setItem(key,sessionId);
    await fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventName,sessionId,...data})});
  } catch {}
}