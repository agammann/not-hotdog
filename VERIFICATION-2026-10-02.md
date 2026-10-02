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

## Follow-up: optional hosted website mode, source 0.3.2

A second review used seven photographs and the existing mascot illustration. Expected labels and file hashes were recorded before inference. The definition was the existing chat skill's sausage-in-a-split-bun rule; corn dogs, burgers and isolated sausages are negatives. The five added photographs came from Wikimedia Commons with recorded licenses; no personal photos were used or added to this repository.

| Fixture | Expected | Published local model | Initial GPT-5.4 candidate |
| --- | --- | --- | --- |
| [Chicago-style hotdog](https://commons.wikimedia.org/wiki/File:Chicago_style_hotdog.jpg) | HOTDOG | NOT HOTDOG | HOTDOG |
| [Chili dogs](https://commons.wikimedia.org/wiki/File:Chili_dogs.jpg) | HOTDOG | NOT HOTDOG | HOTDOG |
| [Cheeseburger](https://commons.wikimedia.org/wiki/File:Cheeseburger.jpg) | NOT HOTDOG | NOT HOTDOG | NOT HOTDOG |
| [Corn dogs](https://commons.wikimedia.org/wiki/File:Corn_dogs.jpg) | NOT HOTDOG | NOT HOTDOG | NOT HOTDOG |
| [Plated sausages without buns](https://commons.wikimedia.org/wiki/File:Plate_of_Bratwurst_at_Die_Weiss,_Salzburg_(2072160820).jpg) | NOT HOTDOG | NOT HOTDOG | NOT HOTDOG |
| Existing hotdog photograph | HOTDOG | HOTDOG | HOTDOG |
| Existing banana photograph | NOT HOTDOG | NOT HOTDOG | NOT HOTDOG |
| Existing mascot illustration | HOTDOG | NOT HOTDOG | HOTDOG |

The public website ran the actual local MobileNet worker in isolated Edge 154.0.4258.48. Its app, worker, model JSON and weight assets matched the reviewed source. All eight checks completed without page exceptions or image uploads. One hosting-injected inline script was blocked by CSP; the classifier continued normally. Local-model scores ranked the Chicago hotdog third and chili dogs fourth, so merely lowering the 0.20 cutoff would not fix their failed relative-lead checks. The model and threshold remain unchanged.

The initial hosted candidate made exactly one real GPT-5.4 request per image with no retries, using a locally re-encoded JPEG at most 768 pixels per side. All eight labels matched the preset expectations. This small challenge set is not a general accuracy estimate. That initial candidate also generated a short explanation, and its burger explanation inferred a meat type that the image could not establish.

Two subsequent real API checks through the rendered local app produced the correct chili-dog and burger labels, but free text still inferred a meat type despite stricter instructions. The final contract therefore accepts only HOTDOG, NOT HOTDOG or UNCERTAIN. The interface supplies fixed wording that describes the model's judgment; it does not generate ingredient explanations or confidence percentages. One final real burger check passed through the rendered app and actual API with this final contract. The eight-image comparison above belongs to the earlier candidate and has not been rerun against the final contract.

Final source checks in isolated Edge covered:

- The actual local hotdog sample still returned HOTDOG, and its result remained separate from the hosted result.
- Selecting, uploading and hovering sent no hosted request; Send made one request with the selected JPEG and supported model. The key was supplied only as authorization, not in the JSON body.
- The local server and browser child had no environment API key. A missing visitor key returned 401 without provider access.
- Clear, switching to device mode, navigation and reload cleared the key. localStorage, sessionStorage, IndexedDB, Cache Storage and cookies were empty after the checks.
- Replacing an image discarded a delayed response. This lifecycle check used a deliberately delayed test response, separately from real model-quality checks.
- Hosted controls fit 1440, 390 and 320 pixel viewports without horizontal overflow. No page exceptions were recorded.

The pinned-model build and all 26 automated tests passed. Tests cover request bounds and origin, the fixed provider and visitor authorization, refusal/incomplete/error responses, cancellation while reading a provider body, key clearing, and stale results. This follow-up did not repeat installed-extension or signed-in chat-plugin tests, exercise a real phone, or establish hosted quality on a large or ambiguous-image population. Publication and production-route verification are separate release steps.
