# October 2, 2026 UTC verification

Environment: Windows, Node 24.19.0, pnpm 11.19.0, Chrome 154.0.8037.95 and Edge 154.0.4258.48. Tests used the repository's existing hotdog and banana photographs and synthetic invalid inputs.

## Public website

Both installed browsers exercised the public site with Playwright:

- Enabling the classifier and selecting the two samples produced HOTDOG and NOT HOTDOG through the actual local model.
- Selecting the local banana image through the file input created a new card and produced NOT HOTDOG.
- Escape paused classification; Clear results removed all verdicts; unsupported text uploads showed a validation error.
- The classifier fit 1440, 390 and 320 pixel viewports without horizontal overflow. Screenshots were captured; the 320 pixel Chrome view was visually inspected.
- Privacy, terms, credits and extension installation pages returned HTTP 200. No page errors were recorded.

The same website flow passed against the rebuilt local app in Chrome. The build verified all pinned model files and bundled 17,015,456 weight bytes.

## Downloaded browser companion

The public extension ZIP was downloaded and extracted afresh. Its SHA-256 was:

```text
41f5b0cf1c3e88718e9840e8282f33af7ac720d74ac29fb3412dac698da97462
```

That exact extension was installed into isolated Chrome and Edge test profiles. Testing used the browsers' actual Manifest V3 service worker, storage, content script, popup and capture APIs. The browser ran headlessly; DevTools' extension testing interface loaded the unpacked package and invoked its toolbar action. No Chrome APIs or classifier responses were mocked.

Both browsers passed:

1. Hovering before activation produced no verdict.
2. Opening the real toolbar popup and selecting **Enable on this tab** enabled local classification.
3. A same-origin hotdog photograph produced HOTDOG; the banana produced NOT HOTDOG.
4. A photograph served from another local origin tainted the page canvas. The extension's real visible-tab capture and crop path still produced HOTDOG.
5. Escape hid the verdict and cleared activation; reopening the popup offered **Enable on this tab**.
6. Reloading the page cleared activation, confirmed through actual extension storage and the reopened popup.

The extracted public package matched the rebuilt extension file contents after normalizing a line-ending difference in `popup.js`; model weights and background code matched byte for byte. The checks did not modify the user's normal browser profile. They cover these fixtures and transitions, not general image accuracy, every site, browser-store installation or all service-worker lifecycle races.

## Source and chat plugin

Frozen installation, build and all 18 automated tests passed. fflate was updated from 0.8.2 to 0.8.3; the dependency audit then reported no known vulnerabilities. The advisory concerns ZIP decompression, while this repository uses fflate for packaging. No exploitable application path is claimed. CI now includes the dependency audit.

The [official plugin listing](https://chatgpt.com/plugins/plugins_6aa62d11f8308191af4d7ab1aba34ec3) was checked while signed out and showed not hotdog, Entertainment, version 0.2.2 and an Install plugin action. This review did not repeat a signed-in chat-plugin conversation. Prior chat-plugin checks remain in [release status](RELEASE_STATUS.md); website and extension tests do not establish that separate host flow.
