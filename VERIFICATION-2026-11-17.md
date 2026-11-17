# 1.0.1 readiness verification, November 17, 2026

## Source and setup

The clean source baseline was `f92c5d26894868d22721b5e533c34c94ab9ead43`. Its package still said 1.0.0, but four dependency/tooling files differed from the published 1.0.0 release. This patch delivers those changes with current setup guidance. The approved chat plugin remains a separate 0.2.2 package.

Local checks used Node 24.22.1 and pnpm 11.19.0. Frozen installation, model verification/build, 26 unit tests, the release guard and dependency audit passed; the audit reported no known vulnerabilities. All original MobileNet inputs matched `MODEL.lock.json`, producing 17,015,456 weight bytes. The installed 47-package engine inventory requires at least Node 24.15.0 within the supported 24.x line. That metadata minimum was not separately executed; CI selects 24.19.0.

## Actual device workflows

Chrome for Testing 155.0.8059.12 passed the eleven rendered website checks with the real worker and CPU-backed model. They cover explicit activation, both sample verdicts without uploads, Escape/Clear, invalid and undecodable images, replacement recovery, blocked-model recovery, inert hosted selection, controlled cancellation, key clearing/empty application storage, narrow layouts and route rejection. The delayed hosted response is a controlled transport fixture, not a paid inference result. Page errors were empty.

The built 1.0.1 companion ZIP was extracted and loaded in fresh profiles of Chrome 155.0.8059.12 and Edge 157.0.4341.60. Each passed eight checks using actual extension APIs: inert opening, broken-image error, toolbar activation/hotdog inference, banana inference, cross-origin canvas rejection followed by visible-tab crop inference, Escape pause, navigation reset and rejection on the real browser settings page. No Chrome APIs or verdicts were mocked. These checks do not establish compatibility with every webpage or a browser-store listing.

The source owner kept automated fixture ports separate from the manual interface. An independent user-interface check exercised the existing public device mode and the freshly built local site: hotdog and banana verdicts, invalid text rejection, damaged JPEG error, replacement-image recovery, Escape and Clear. The final 1.0.1 interface also passed a real worker hotdog check and displayed the corrected MIT terms. Browser errors and warnings were empty. No key or paid request was used.

The unchanged shipped chat skill was separately applied to actual hotdog, banana and mascot images using the host assistant's image understanding. It returned HOTDOG, NOT HOTDOG and HOTDOG. This is not a fresh installed-portal-plugin invocation, device-model result or paid API check.

## Reproducible companion packaging

Two full builds from identical tracked inputs ran in separate Node processes with measured `UTC` and `America/Los_Angeles` time zones. Sorted ZIP paths and a fixed local-calendar midnight make DOS timestamps independent of those zones. The companion ZIPs were byte-identical (`b97f1fa6d1b71ff205d8225ded8ff307d1a80772b3c136efaf1c3435ac72de6b`). All sixteen extracted files matched between builds. Relative to the retained baseline, only `manifest.json` changed, solely from version 1.0.0 to 1.0.1; runtime, model, license and permission contents were unchanged.

The existing public 1.0.0 companion already matched its GitHub archive. This change improves future rebuild reproducibility; it does not describe a broken earlier delivery. The approved plugin's identity, contents and existing packaging strategy are unchanged.

## Scope and delivery boundary

The model, threshold, visitor-key proxy and label-only hosted contract are unchanged. The October 8 paid image comparison and observed MobileNet misses remain historical evidence in [the earlier record](VERIFIED.md). This run did not repeat paid inference or use real API credentials. The entertainment and no-food-safety limitations remain.

Current terms now state the existing MIT grant, and the companion is described as an unpacked distribution. Older explicitly dated preview statements remain historical. The application/local server retires `/mcp` with 410; the public hosting platform currently intercepts that route with 404. Neither surface offers an MCP service.

The reviewed source still requires exact-commit CI, including aggregate security check results, before merge/publication. Actual downloaded-source, seven-asset/tag/checksum, preserved-plugin, canonical deployment and live delivery acceptance are recorded separately after publication; this dated local record does not claim those later gates have passed.
