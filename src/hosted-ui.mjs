import {classifyHosted} from './hosted-client.mjs';
import {hostedMessages} from './hosted-contract.mjs';

export function setupHosted({prepareImage, stopDevice}) {
  const mode = document.querySelector('#check-mode'), panel = document.querySelector('#hosted-panel');
  const key = document.querySelector('#visitor-key'), check = document.querySelector('#hosted-check'), cancelButton = document.querySelector('#hosted-cancel');
  const selectedLabel = document.querySelector('#hosted-selected'), status = document.querySelector('#hosted-status');
  const result = document.querySelector('#hosted-result');
  let selected, controller, revision = 0;
  const active = () => mode.value === 'hosted';
  function sync() { check.disabled = !selected || !!controller; cancelButton.disabled = !controller; }
  function cancel(message = '') {
    revision++; controller?.abort(); controller = null; panel.removeAttribute('aria-busy'); sync();
    if (message) status.textContent = message;
  }
  function clearResult() { result.hidden = true; result.replaceChildren(); }
  function captions() {
    document.querySelectorAll('.image-card').forEach(card => { if (!card.dataset.verdict) card.querySelector('.verdict').textContent = active() ? 'SELECT IMAGE' : 'HOVER TO FIND OUT'; });
  }
  function clearSelection() {
    cancel(); selected?.removeAttribute('data-selected'); selected = null; clearResult();
    selectedLabel.textContent = 'Select an image below. Selecting or hovering sends nothing.'; captions(); sync();
  }
  function forget() { key.value = ''; clearSelection(); status.textContent = 'Key cleared. No hosted check is running.'; }
  function select(card) {
    if (!active() || selected === card) return;
    clearSelection(); selected = card; selected.dataset.selected = 'true';
    selectedLabel.textContent = `Selected: ${card.querySelector('.card-title').textContent}.`;
    status.textContent = 'Ready when you choose Send selected image.'; sync();
  }
  function changeMode() {
    forget(); stopDevice(); captions(); panel.hidden = !active(); key.disabled = !active(); document.querySelector('#enable').hidden = active();
    document.querySelector('#status').textContent = active() ? 'Click an image to select it. A separate button sends one hosted request.' : 'Device mode. Enable hover to start; images stay on this device.';
  }
  mode.addEventListener('change', changeMode);
  key.addEventListener('input', () => { cancel('Key updated. Choose Send selected image when ready.'); clearResult(); });
  document.querySelector('#clear').addEventListener('click', forget);
  cancelButton.addEventListener('click', () => cancel('Hosted check canceled. A request already sent may still be billed.'));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && controller) cancel('Hosted check canceled. A request already sent may still be billed.'); });
  window.addEventListener('pagehide', () => { mode.value = 'device'; changeMode(); });
  check.addEventListener('click', async () => {
    if (!active() || !selected || controller) return;
    const card = selected, current = ++revision, request = new AbortController(); controller = request;
    clearResult(); sync(); panel.setAttribute('aria-busy', 'true'); status.textContent = 'Preparing this image, then requesting one GPT-5.4 second opinion…';
    const timeout = setTimeout(() => request.abort(new DOMException('The hosted check timed out.', 'TimeoutError')), 95000);
    try {
      const image = await prepareImage(card.querySelector('img'));
      if (current !== revision) return;
      const answer = await classifyHosted(image, {apiKey: key.value, signal: request.signal});
      if (current !== revision) return;
      const label = document.createElement('strong'); label.textContent = `GPT-5.4: ${answer.value.verdict}`;
      const reason = document.createElement('p'); reason.textContent = hostedMessages[answer.value.verdict];
      result.replaceChildren(label, reason); result.hidden = false;
      status.textContent = 'Hosted second opinion complete. Local image verdicts are unchanged. Models can be wrong.';
    } catch (error) {
      if (current === revision) status.textContent = request.signal.aborted ? 'Hosted check timed out or was canceled. A request already sent may still be billed.' : error.message || 'The hosted check failed. Try again when ready.';
    } finally {
      clearTimeout(timeout);
      if (current === revision) { controller = null; panel.removeAttribute('aria-busy'); sync(); }
    }
  });
  return {active, select, clearSelection};
}
