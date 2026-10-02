# not hotdog

[Install the OpenAI plugin](https://chatgpt.com/plugins/plugins_6aa62d11f8308191af4d7ab1aba34ec3) · [Website](https://not-hotdog.alx21.chatgpt.site)

Two ways to ask a very small question: hotdog or not hotdog?

The website source is version 0.3.2, with a local image classifier and an optional GPT-5.4 second opinion using your own OpenAI API key. The browser companion is version 0.2.4 and the published OpenAI chat plugin remains version 0.2.2.

The OpenAI plugin uses the host assistant's existing image capabilities for an image shared in ChatGPT or Codex. The companion website and Chrome or Edge extension run MobileNet on the visitor's device. The extension adds opt in hover detection on regular webpages.

Device mode and the chat plugin require no API key. Normal ChatGPT or Codex plan limits apply to the chat workflow. The optional hosted website mode uses the visitor's own API billing; it never uses a publisher key. ChatGPT subscriptions do not include API usage.

Publisher and support: [agammann](https://github.com/agammann). [Report an issue](https://github.com/agammann/not-hotdog/issues).

## Try it in your browser

1. Open the [website](https://not-hotdog.alx21.chatgpt.site) and choose **Enable hover**.
2. Hover over or click either sample. The first check loads about 17 MB of model files onto your device.
3. Choose **Choose an image** to try your own PNG, JPEG or WebP file smaller than 12 MB. Click the new image for its verdict.
4. Press Escape to pause or choose **Clear results** to remove the displayed verdicts.

The website works without installing the chat plugin or browser extension. The extension adds hover checks to other webpages; the chat plugin works with images shared in an assistant conversation. These are separate installs.

### Optional hosted second opinion

Choose **Hosted second opinion** under **How to check**, enter your own OpenAI API key, and select an image. Press **Send selected image** to make one GPT-5.4 request. Selecting, uploading, and hovering alone make no hosted request. The hosted result appears separately from any local verdict and may say UNCERTAIN when the image is obstructed or ambiguous. Both models can be wrong.

The browser resizes the selected image to at most 768 pixels per side and re-encodes it as JPEG, removing file metadata. That image and your key pass through this site's server to OpenAI. The application does not save either. Your key stays in page memory until Clear, device mode, page exit, or reload. Cancel stops waiting; a request already sent may still be billed. See [API pricing](https://openai.com/api/pricing/) and [privacy details](https://not-hotdog.alx21.chatgpt.site/privacy).

## Run and build

Use Node.js 24 and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm dev
```

Open http://127.0.0.1:4317. Enable hover and point at a sample, click it, or choose a local image. Escape pauses checks. Clear results removes page verdicts.

The build downloads the TensorFlow MobileNet V1 1.0 ImageNet model from its official storage source and verifies every file against MODEL.lock.json. The bundled weights total 17,015,456 bytes (about 17 MB). They are bundled into the extension and served as static files by the website. Device checks have no remote fallback.

The local server also supports the optional hosted workflow at `POST /api/classify/visitor`. It accepts only the visitor-supplied Bearer key, a bounded JPEG raster, and the supported model. It calls the fixed OpenAI Responses endpoint with `store: false`, a 500-token output limit and a 90-second timeout. There is no environment-key fallback, arbitrary provider URL, or automatic retry. Neither building nor starting the server requires an API key.

The original `/api/classify` and `/mcp` endpoints return HTTP 410. The optional hosted website flow uses `/api/classify/visitor`; earlier commits describe a separate, superseded API prototype.

## Install the browser companion

After building, extract `public/not-hotdog-extension.zip`. Open Chrome or Edge Extensions, enable Developer mode, choose Load unpacked, and select the extracted directory containing manifest.json. Open a regular webpage, click the extension icon, and enable it for that tab. Navigation resets activation; Escape pauses it.

The extension bundles JavaScript and model weights and has no external host permissions. It handles visible top level HTML images. If direct canvas access is blocked, it locally crops an active tab capture to the hovered image. The full screenshot is never uploaded or returned to page scripts. CSS backgrounds, frames, video, browser settings pages, and offscreen images are outside this preview. Overlays can affect the crop.

The local image model works best with clear photographs. Completed checks return HOTDOG when the hotdog class has a strong lead and NOT HOTDOG otherwise. Loading and decoding failures remain errors rather than image verdicts. Model rankings are not calibrated probabilities of correctness. Drawings and heavily topped hotdogs may be unreliable. The optional hosted mode offers a second opinion, not a guarantee. This is entertainment, not a food safety or allergy tool.

## OpenAI plugin

Package `.codex-plugin`, `skills`, and `assets` as a ZIP. Submit using Skills only in the OpenAI plugin portal. The skill uses the host assistant to inspect a selected image. It has no MCP server or credentials. Installing it does not install the browser companion. Draft test cases and metadata are in chatgpt-app-submission.json.

See [release status](RELEASE_STATUS.md) for deployment and submission history, and [October 2 verification](VERIFICATION-2026-10-02.md) for actual Chrome and Edge website and installed-extension checks. Public GitHub source does not imply OpenAI approval or a browser store listing.

## Hosting and data

The Worker serves application assets and forwards explicit visitor-key checks to OpenAI. It does not read or write a database. The hosting manifest contains the owning Sites project identifier in the deployment checkout and a generic template in the public repository. Configure your own project when deploying.

Device-mode and extension images stay on device. Optional hosted checks send only the selected, re-encoded image and visitor key through the site's server to OpenAI after an explicit Send action. No key is saved in localStorage, sessionStorage, IndexedDB, or application logs. OpenAI's normal API data policies still apply even with `store: false`. Chat images are handled by the host assistant under its normal policies. Hosting processes ordinary file requests and network metadata. See public/privacy.html and public/terms.html.

## Rights and credits

Application source has no open source license grant. TensorFlow.js and MobileNet model files retain their Apache 2.0 terms. Bundled notices are included in the extension. Other dependencies retain their own licenses. Photo credits are in public/credits.html.

