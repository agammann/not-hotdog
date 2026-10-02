import { HOSTED_MODEL, validateHostedImage, validateHostedVerdict } from './hosted-contract.mjs';

export async function classifyHosted(image, { apiKey, signal } = {}) {
  signal?.throwIfAborted();
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!/^sk-[A-Za-z0-9_-]{16,512}$/.test(key)) throw Error('Enter your own OpenAI API key for a hosted check.');
  const input = validateHostedImage(image);
  const response = await fetch('/api/classify/visitor', {
    method: 'POST', credentials: 'omit', cache: 'no-store', redirect: 'error', signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ image: input, model: HOSTED_MODEL }),
  });
  let result;
  try { result = await response.json(); }
  catch (error) { signal?.throwIfAborted(); if (error?.name === 'AbortError') throw error; throw Error('The hosted service did not return a verdict. Open the website or its local server and try again.'); }
  signal?.throwIfAborted();
  if (!response.ok) throw Error(typeof result?.error === 'string' && result.error.length <= 300 && !result.error.includes(key) ? result.error : 'Hosted checks are unavailable. Try again later.');
  if (result.model !== HOSTED_MODEL) throw Error('The hosted service returned an unexpected model.');
  const value = validateHostedVerdict(result.value);
  return { value, model: result.model };
}
