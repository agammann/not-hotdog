import { HOSTED_MODEL, validateHostedImage, validateHostedVerdict, visionRequest } from './hosted-contract.mjs';

class RequestError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
async function limitedText(message, limit, signal) {
  const reader = message.body?.getReader();
  if (!reader) throw new RequestError('The request or response was empty.');
  const parts = []; let size = 0;
  const stop = () => { reader.cancel(signal.reason).catch(() => {}); };
  signal.addEventListener('abort', stop, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const { value, done } = await reader.read(); signal.throwIfAborted(); if (done) break;
      size += value.byteLength;
      if (size > limit) throw new RequestError('The image or response is too large.', 413);
      parts.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    return new TextDecoder().decode(bytes);
  } finally { signal.removeEventListener('abort', stop); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
function providerError(status) {
  if (status === 401) return new RequestError('OpenAI rejected this key. Check your API key and try again.', 401);
  if (status === 403 || status === 404) return new RequestError('This key cannot access GPT-5.4. Check its model permissions.', 403);
  if (status === 429) return new RequestError('OpenAI reported a usage or rate limit. Check your API billing and limits.', 429);
  return new RequestError('OpenAI could not check this image. Try again later.', 502);
}
// The supplied visitor key is the sole credential; there is no environment fallback or retry.
export async function visitorClassify(request, { fetchImpl = fetch } = {}) {
  let signal;
  try {
    if (request.method !== 'POST') throw new RequestError('Method not allowed.', 405);
    if (request.headers.get('Origin') !== new URL(request.url).origin) throw new RequestError('Open not hotdog to check an image.', 403);
    const key = /^Bearer (sk-[A-Za-z0-9_-]{16,512})$/.exec(request.headers.get('Authorization') || '')?.[1];
    if (!key) throw new RequestError('Enter your own OpenAI API key for a hosted check.', 401);
    if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) throw new RequestError('Send a JSON image request.');
    signal = AbortSignal.any([request.signal, AbortSignal.timeout(90000)]);
    let image;
    try {
      const data = JSON.parse(await limitedText(request, 2_010_000, signal));
      if (data.model !== HOSTED_MODEL || Object.keys(data).sort().join(',') !== 'image,model') throw Error('input');
      image = validateHostedImage(data.image);
    } catch (error) { signal.throwIfAborted(); if (error instanceof RequestError) throw error; throw new RequestError('Send one JPEG image at most 768 pixels per side with the supported model.'); }
    signal.throwIfAborted();
    const response = await fetchImpl('https://api.openai.com/v1/responses', {
      method: 'POST', redirect: 'manual', signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(visionRequest(image)),
    });
    if (!response.ok) { await response.body?.cancel(); throw providerError(response.status); }
    let completion;
    try { completion = JSON.parse(await limitedText(response, 64 * 1024, signal)); }
    catch { signal.throwIfAborted(); throw new RequestError('The hosted service returned an unreadable verdict.', 502); }
    signal.throwIfAborted();
    if (completion.status !== 'completed') throw new RequestError('The hosted verdict did not finish. Try again.', 502);
    const content = (completion.output || []).flatMap(item => item.type === 'message' ? item.content || [] : []);
    if (content.some(part => part.type === 'refusal')) throw new RequestError('The model could not check this image. Choose another image.', 422);
    const output = content.filter(part => part.type === 'output_text').map(part => part.text).join('');
    if (!output || output.includes(key)) throw new RequestError('The hosted verdict could not be returned safely.', 502);
    let value;
    try { value = validateHostedVerdict(JSON.parse(output)); } catch { throw new RequestError('The hosted service returned an invalid verdict.', 502); }
    return json({ value, model: HOSTED_MODEL });
  } catch (error) {
    if (request.signal.aborted) return json({ error: 'Hosted check canceled.' }, 499);
    if (signal?.aborted) return json({ error: 'The hosted check timed out. Try again when ready.' }, 504);
    return json({ error: error instanceof RequestError ? error.message : 'The hosted check could not be completed. Try again later.' }, error instanceof RequestError ? error.status : 502);
  }
}
