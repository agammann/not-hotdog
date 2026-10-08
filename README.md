# not hotdog

Big question. Small bun. A playful image classifier for photos you choose and images you hover over.

[Try the website](https://not-hotdog.alx21.chatgpt.site) · [Install the chat plugin](https://chatgpt.com/plugins/plugins_6aa62d11f8308191af4d7ab1aba34ec3) · [Release downloads](https://github.com/agammann/not-hotdog/releases/latest)

| Delivery | How it checks | What you need |
| --- | --- | --- |
| Website | MobileNet on your device; optional GPT-5.4 second opinion | A modern browser; your own OpenAI API key only for hosted mode |
| Chrome/Edge companion | Bundled MobileNet on your device | Load the companion ZIP unpacked, then enable each tab |
| Chat plugin | Your host assistant's image understanding | Install the plugin and share/select an image in a supported host |

These are three separate installs. For entertainment: no ingredient, allergy, nutrition or food-safety assessment. The local model can miss topped hotdogs and drawings. The chat/hosted definition is a frankfurter-style sausage in a split bun, including a recognizable drawing or visibly matching plant-based version. Corn dogs, isolated sausages and burgers are negatives. Ambiguous images can receive UNCERTAIN in the chat or hosted workflow. [Observed labels and limitations](VERIFIED.md).

## Use the website

1. Open the website and choose **Enable hover**.
2. Hover over or click the hotdog sample: the tested example returns **HOTDOG**. The banana sample returns **NOT HOTDOG**.
3. Choose a PNG, JPEG or WebP smaller than 12 MB to try your own photo. Images must have at most 16 million pixels. Click or press Enter on its card to check it.
4. Press Escape to pause. **Clear results & key** clears verdicts and the optional key.

First device use loads about 17 MB of model weights. No account or API key is needed. Images and local verdicts remain in the current page; the application does not save history or provide export. Save your own verdict before leaving if you need it. Image or model-load failures show an error, never a negative verdict.

For a hosted second opinion, switch **How to check** to hosted mode, enter your own OpenAI API key, select an image and press **Send selected image**. Selection, upload and hover send nothing. Each press makes one GPT-5.4 request; there is no silent fallback or automatic retry. Its result is separate from the local verdict. Your API account pays; a ChatGPT subscription does not include API usage.

Hosted mode resizes the selected image to at most 768 pixels per side and re-encodes it as JPEG to remove file metadata. That image and key pass through this site's server to the fixed OpenAI Responses API with `store: false`. The app does not save them or put them in application logs. Provider and hosting policies still apply; see [Privacy](https://not-hotdog.alx21.chatgpt.site/privacy). Clear, changing to device mode, leaving or reloading forgets the key. Cancel stops waiting; a request already sent may still be processed and billed.

## Install the companion

Download `not-hotdog_1.0.0_extension.zip` from the release, or use the [website companion download](https://not-hotdog.alx21.chatgpt.site/extension). Extract it into a permanent folder.

1. Open `chrome://extensions` or `edge://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select the extracted folder containing `manifest.json`.
3. Open a regular webpage. Click the not hotdog toolbar icon and choose **Enable on this tab**.
4. Hover over a fully visible HTML image for a moment. Escape pauses; navigation resets activation. Enable it again after navigating.

The companion targets desktop Chrome and Edge Manifest V3. It is an unpacked distribution, not a browser-store listing. The v1 checks cover actual toolbar, service-worker, content-script and capture APIs in the browsers listed in [verification](VERIFIED.md).

No external host permissions or hosted inference are used. When a page blocks canvas access to an image, the extension crops an active-tab capture locally to the visible image. It does not upload or return the whole screenshot to the page. Overlays can affect that crop. Top-level `<img>` elements are supported; CSS backgrounds, frames, video, browser settings and offscreen/partially visible images are outside this workflow. An in-progress local calculation may finish after Pause, although no new checks start.

## Install the chat skill

The [approved plugin listing](https://chatgpt.com/plugins/plugins_6aa62d11f8308191af4d7ab1aba34ec3) is the normal installation route. Select not hotdog in your host, then share or explicitly select an image and ask “Is this a hotdog?” It gives HOTDOG, NOT HOTDOG or UNCERTAIN. If no accessible image is provided, it asks for one.

Installing this plugin does not install the browser companion or enable hover. It uses the host assistant's image understanding and normal plan/data limits, not the website's local model. It has no MCP server, inference scripts, publisher API key or separate paid API calls. It does not ask for an API key.

`not-hotdog_plugin_0.2.2.zip` contains the existing `.codex-plugin`, `skills` and `assets` layout plus the MIT license. Its identity and skill content are preserved from the approved 0.2.2 plugin. Developers can inspect that package and submit a skills-only plugin through their host's supported workflow; an arbitrary ZIP is not automatically installed by opening it. Dated verification separates shipped-skill checks from installed-host checks.

## Run from source

Install Node.js **24** and **pnpm 11.19.0**. If pnpm is absent, run `npm install --global pnpm@11.19.0`. Download and extract `not-hotdog_1.0.0_source.zip`, open a terminal in its `not-hotdog-1.0.0` folder, then run:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm start
```

Open **http://127.0.0.1:4317**. `pnpm dev` starts the same local server. Build before either command: the server serves the last generated assets and does not watch source changes. Stop with Ctrl+C. It binds only to loopback; change `PORT` if 4317 is in use.

The first build downloads TensorFlow's official MobileNet files and checks every SHA-256 in `MODEL.lock.json`. It bundles 17,015,456 weight bytes, website JS and the companion ZIP. Internet is required during installation/first build; no API credential is used to build. The source archive omits dependencies, cached weights, private test images and keys.

```sh
pnpm test:e2e        # rendered website, actual local model and recovery
pnpm test:extension # actual unpacked companion in an isolated Chrome profile
pnpm check:release
pnpm audit
```

Browser checks use installed Chrome by default and run headlessly. Install desktop Chrome first, or set `NOT_HOTDOG_BROWSER_EXECUTABLE` to a compatible Chrome-for-Testing executable. The extension check invokes Chrome's actual toolbar action through its extension testing interface; no Chrome APIs or verdicts are mocked. To check Edge, run `node scripts/check-extension.mjs msedge` after installing Edge, with the executable override unset. These checks use local fixture servers and never pay for hosted inference. The website cancellation test deliberately delays a controlled response, separately from real-model checks.

Developer entrypoints: `src/website.mjs` controls cards; `src/device-engine.mjs` runs TensorFlow in a worker; `src/verdict.mjs` applies the binary threshold; `src/hosted-contract.mjs` defines the fixed label-only request; `src/visitor-classify.mjs` is the bounded visitor-key proxy. Companion entrypoints are `extension/popup.js`, `extension/content.js` and `src/extension-background.mjs`. Chat instructions are in `skills/hotdog-verdict/SKILL.md`.

`POST /api/classify/visitor` requires same-origin JSON, the supported model, a bounded JPEG and the visitor's bearer key. It makes one fixed-provider request, with no environment-key fallback or provider URL override, 500 output tokens and a 90-second timeout. The older `/api/classify` and `/mcp` routes return 410. `.openai/hosting.json` declares the generated Worker deployment. No database or publisher credential is required.

## Upgrade and recover

Verify archives against the release's `SHA256SUMS` (`Get-FileHash archive.zip -Algorithm SHA256` in PowerShell, or `sha256sum archive.zip` on Linux). Extract a new source folder, install frozen dependencies and rebuild; do not copy old `node_modules` or generated files over it. Keep API keys outside source control. The website does not need `.env`; visitors enter their key in the page.

For the companion, replace its extracted folder with the new release and click **Reload** on the Extensions page, then enable the desired tab again. Choose **Remove** there to remove the companion and installed model files.

- Image failure: choose a decodable supported image, then click again. Clear stops a pending local check and resets its worker.
- Model download/build failure: restore network access and rebuild. For an integrity mismatch, remove only this project's `.model-cache` folder and rebuild; never bypass pinned hashes.
- Hosted key/access/rate error: correct your API key, GPT-5.4 permissions or billing/limits, then explicitly Send again. There is no automatic paid retry.
- Protected companion page: switch to a regular HTTP(S) webpage. Scroll until the entire image is visible.
- Unexpected result: try the optional hosted second opinion or treat the verdict as the toy's opinion. Do not use it for a food-safety decision.

Support: [GitHub Issues](https://github.com/agammann/not-hotdog/issues). Include the version/browser and reproduction steps; do not post private images or keys. Original source is [MIT licensed](LICENSE). [Third-party notices](THIRD_PARTY_NOTICES.md) retain photograph, font, TensorFlow and bundled dependency terms.
