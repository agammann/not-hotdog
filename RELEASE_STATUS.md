# not hotdog release status

Version 0.2.2 is approved and published in the OpenAI Plugins Directory with package name `not-hotdog`. The replacement listing was verified while logged out. It shows not hotdog, Entertainment, version 0.2.2, an Install plugin button, and the current website and policy links. The superseded package has been unpublished.

[Official directory listing](https://chatgpt.com/plugins/plugins_6aa62d11f8308191af4d7ab1aba34ec3)

[Public website](https://not-hotdog.alx21.chatgpt.site)

[Companion extension](https://not-hotdog.alx21.chatgpt.site/extension)

[Public repository](https://github.com/agammann/not-hotdog)

## October 2, 2026 verification

The public website is 0.3.1, its downloadable companion is 0.2.4, and the official directory listing still shows chat plugin 0.2.2. The website and the actual downloaded extension passed fresh checks in Chrome 154.0.8037.95 and Edge 154.0.4258.48. Extension checks covered toolbar activation, local inference, cross-origin screenshot cropping, Escape and navigation reset. The model weights total 17,015,456 bytes. See the [dated verification record](VERIFICATION-2026-10-02.md) for exact scope and limitations.

All 18 automated tests passed after updating fflate to 0.8.3, and the dependency audit reported no known vulnerabilities. CI now runs that audit after the build and tests.

## Earlier verification: companion 0.2.3

1. All current tracked source files and all release archives were checked for the previous product name, with zero matches.
2. Public website, privacy, terms, extension instructions, health, and extension ZIP returned HTTP 200 without authentication. The downloaded ZIP matches the local release byte for byte.
3. The 0.2.3 companion release fixes local data decoding under the extension's strict connection policy, acknowledges activation, rolls back failed activation, prevents duplicate pause writes, validates fully visible images, discards stale image results, and rejects captures after a tab change. Regression tests cover local decoding with fetch forbidden, capture cleanup, tab changes, and activation failure. Earlier GitHub CI run 34739155586 covered the preceding 0.2.2 application.
4. Website and extension inference run on device. The host chat plugin uses existing assistant capabilities and normal host limits. No publisher API key is used or configured.
5. Both sample photographs passed real local and hosted model checks. The model weights total 1,902,176 bytes and are verified against pinned hashes.
6. The published chat plugin was installed and tested in ChatGPT: no image prompted an attachment request, the hotdog and banana photos returned the expected verdicts, and the companion instructions and URL were correct. The chat plugin remains version 0.2.2; the website and browser companion are version 0.2.3.

## Limits

At this earlier checkpoint, extension behavior tests used simulated Chrome APIs and a DOM; actual installed Chrome and Edge checks were added on October 2 as recorded above. The extension remains an unpacked preview. Two sample images do not establish general accuracy. No browser store listing is claimed.

Historical Git commits and retired platform records retain their original metadata. Current names, package identifiers, source files, URLs, directories, and downloads use not hotdog or not-hotdog.

## Website design release 0.3.0

The website now has an original illustrated mascot, poster typography, a vivid snack counter palette, responsive verdict boards, and clearer installation links. Fonts and artwork are served locally. The chat plugin remains 0.2.2 and the browser extension remains 0.2.3.

All 17 automated checks pass, including new website regressions for cancellation races, Escape while busy, upload validation, and local object URL cleanup. Real browser checks cover the two sample verdicts and local image selection. Desktop and phone layouts were visually inspected. The source and website are prepared for publication through the existing release process; deployment identifiers are recorded in the external publication report after completion.

## Binary photo classifier release 0.3.1

The website now returns HOTDOG or NOT HOTDOG for every completed classification. Loading, decoding, missing output, and invalid scores remain errors. The companion extension is 0.2.4 and shares this classifier. The separately published chat plugin remains 0.2.2 and retains its host assistant behavior.

MobileNet V1 1.0 replaces the 0.25 model. Full precision weights total 17,015,456 bytes and source files are pinned in MODEL.lock.json. Model paths and the website worker URL are versioned to avoid mixing cached releases. The model runs locally and no publisher API is used.

Eighteen automated checks passed. Actual browser inference passed five hotdog photo inputs and six nonhotdog inputs, including the image that previously returned UNCERTAIN. Two of the five positive inputs depict the same source photograph, so this is a small regression set rather than an independent accuracy benchmark. The illustrated site mascot remains a known false negative. A smaller quantized candidate was rejected after missing photos that the full precision model recognized.

The original image was selected through the website file picker, correctly classified as NOT HOTDOG, and Escape paused further checks. Browser error logs were empty. Private user images and temporary third party test images are excluded from source and release artifacts. At this release checkpoint installed-extension behavior was still unverified; the October 2 record above supersedes that limitation for its listed scenarios.
