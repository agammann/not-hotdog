# v1 verification

Fresh source checks were run on October 8, 2026 UTC with Node 24.19.0, pnpm 11.19.0 and Windows. Browser versions and exact downloaded-release results are recorded separately below as they complete. Earlier October 2 evidence remains in [the dated report](VERIFICATION-2026-10-02.md); it is not counted as a fresh v1 run.

## Website and model behavior

The source build verified every original MobileNet file against `MODEL.lock.json` and bundled 17,015,456 weight bytes. Frozen dependency installation, all 26 unit tests and the dependency audit passed. The audit reported no known advisories after the compatible source-map-js update.

Chrome for Testing 155.0.8059.12 ran the rendered website with its actual worker and CPU-backed MobileNet. The two published sample photographs produced HOTDOG and NOT HOTDOG. Eleven browser checks covered opt-in activation, sample inference without uploads, Escape/Clear, invalid type and failed image decoding, replacement recovery, blocked model loading and recovery, inert hosted selection, cancellation of a deliberately delayed controlled response, key clearing/empty application storage, 320/390/1440 pixel layouts, policy/download routes and rejected retired/private routes. No page runtime exceptions occurred. Controlled transport checks are distinct from the real paid model checks.

Labels and image SHA-256 values for this eight-image set were frozen before fresh inference. Exactly one completed response per image and mode was retained, without quality retries:

| Image | Expected | Actual MobileNet | Actual GPT-5.4 |
| --- | --- | --- | --- |
| Published hotdog photograph | HOTDOG | HOTDOG | HOTDOG |
| Published banana photograph | NOT HOTDOG | NOT HOTDOG | NOT HOTDOG |
| Chicago-style hotdog | HOTDOG | NOT HOTDOG | HOTDOG |
| Chili dogs | HOTDOG | NOT HOTDOG | HOTDOG |
| Cheeseburger | NOT HOTDOG | NOT HOTDOG | NOT HOTDOG |
| Corn dogs | NOT HOTDOG | NOT HOTDOG | NOT HOTDOG |
| Plated sausages without buns | NOT HOTDOG | NOT HOTDOG | NOT HOTDOG |
| Existing mascot drawing | HOTDOG | NOT HOTDOG | HOTDOG |

All sixteen responses completed through the rendered local website. The eight hosted requests used the final label-only contract, visitor authorization and locally re-encoded JPEGs; fixed interface wording supplied the explanations. Selecting/hovering sent no hosted request. Device checks made no image-upload requests. Clear removed the key; localStorage, sessionStorage, IndexedDB, Cache Storage and cookies were empty.

The local model's three misses remain limitations. This small challenge set is not an accuracy estimate or a calibrated-confidence claim. The source's Chicago/chili/burger/corn-dog/sausage photos came from the licensed private evaluation set described in the older report and are not redistributed in release archives. The binary local threshold/model were not tuned to these images. No safety, ingredient or identity inference is supported.

## Companion

The built companion ZIP was extracted afresh and loaded into isolated Chrome 155.0.8059.12 and Edge 154.0.4258.62 profiles through each browser's actual extension testing interface. No Chrome APIs or verdicts were mocked. Both browsers passed eight checks: no inference before activation, broken-image error, actual toolbar activation and local hotdog inference, banana inference, cross-origin canvas rejection followed by actual visible-tab crop classification, Escape pause, navigation reset and an understandable rejection on the real browser settings page.

Two initial protected-page attempts read the popup before its deferred script was initialized. Both failure records were retained. The popup now starts disabled until initialization; the corrected check passed. The initial Edge harness assumed Chrome's settings URL; it was corrected to Edge's actual `edge://settings` route, with the failed attempt retained. These are installation/transition checks on the stated fixtures, not a claim that every webpage or service-worker race was tested.

## Chat skill

The approved plugin identity and instruction text remain 0.2.2. The source archive ships the same skill-only layout: no MCP server or inference executable. Applying that shipped skill to the actual hotdog, banana, corn-dog and mascot images with the host assistant's vision produced the expected HOTDOG, NOT HOTDOG, NOT HOTDOG and HOTDOG responses; a missing image requires an attachment rather than an invented verdict. This is a shipped-instruction check, not a new installed-portal-plugin invocation. The earlier installed ChatGPT check is separately dated in [release status](RELEASE_STATUS.md).

## Release procedure

CI verifies locked installation/build/tests/audit on Linux and Windows, then exercises the real website/companion on Linux. Source, companion and preserved chat-plugin archives carry SHA-256 checksums. The source archive comes from the exact committed tree; the publisher checks main, immutable version tag, uploaded asset sizes/digests and the complete package set before making the release public. The downloaded source must also pass a fresh consumer installation and documented start commands. Public-site checks and installed-host-plugin checks are separate from source release verification.
