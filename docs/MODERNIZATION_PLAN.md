# Modernization Plan — GitHub Slash Palette

Status: proposal for discussion (2026-06).
Scope: whole-repo assessment — tech stack, architecture, feature portfolio, quality, CI/CD.

---

## 1. Executive summary

The codebase is in better shape than most extensions of this size: strict TypeScript with no
`any`, React 19, a clean command registry pattern, unit + E2E tests, and an unusually good
CI/CD pipeline (PR preview deployments, Chrome Web Store publishing). The stack does **not**
need a wholesale replacement.

The real risks are **product-level**, not stack-level:

1. **The extension only binds to `<textarea>` elements.** GitHub is rolling out its new
   React-based issue/PR experience with contenteditable/ProseMirror editors. When that
   becomes default, the extension silently stops working. This is existential and is the
   top priority.
2. **The feature portfolio is entertainment-skewed** (`//giphy`, `//font`) while the actual
   audience is developers writing issues, PR descriptions, and reviews. The biggest wins are
   dev-workflow commands (`//issue`, `//pr`, `//snippet`, `//suggest`), most of which can
   reuse the existing GitHub token plumbing built for `//link ci`.
3. **No style isolation** (picker renders into GitHub's DOM without shadow DOM) and no React
   error boundary — one GitHub CSS/markup change or one thrown render error can break the UI.

Recommended stack change: **one** — replace the hand-rolled `scripts/build.ts` with
[WXT](https://wxt.dev) to get HMR, manifest generation, zip packaging, and Chrome+Firefox
builds from a single codebase. Everything else (TypeScript, React, Vitest, Playwright, Bun
as package manager/test runner) stays.

---

## 2. Current state assessment

### Strengths (keep, don't touch)

- **Architecture**: `CommandSpec` registry + self-contained command modules + options
  registry is a genuinely good plugin design. New commands slot in cleanly.
- **Type discipline**: strict TS, type-only imports, Zod validation of build env.
- **Testing culture**: 19 unit test files colocated with code; E2E suite covers every command.
- **CI/CD**: parallel check jobs, artifact retention, idempotent releases, GitHub Pages
  PR-preview deployments with cleanup, official Chrome Web Store API publishing.
- **UX details**: caret-anchored positioning, theme detection with override, debouncing,
  per-command caching, setup panels for missing API keys.

### Weaknesses (drive the plan)

| # | Issue | Severity |
|---|-------|----------|
| W1 | Only `<textarea>` supported — GitHub's new contenteditable/ProseMirror editors are not detected (`src/utils/dom.ts`, `src/content/index.ts:373`) | **Critical** |
| W2 | No shadow DOM / CSS isolation; picker styles are inline and live in GitHub's DOM | High |
| W3 | No React error boundary — a render error kills the picker | High |
| W4 | Accessibility: no ARIA roles (combobox/listbox/option), no screen-reader announcements | High |
| W5 | E2E: single 3,727-line spec file, fixed `waitForTimeout()` sleeps, manual `addScriptTag` injection instead of real extension loading | Medium |
| W6 | Chrome-only; custom build script has no HMR, no Firefox target, no zip step | Medium |
| W7 | `fetch()` calls have no timeout, retry, or rate-limit handling (`giphy/api.ts`, `link/api.ts`) | Medium |
| W8 | `//font` colors rely on the LaTeX `$\color{}$` rendering quirk — fragile, breaks in email notifications, hostile to screen readers | Medium |
| W9 | Dead/odd code: `utils/math.ts` reimplements `+`/`-` via two's complement (`neg(b) = add(~b, 1)`), deprecated `renderCurrent` in `CommandSpec` | Low |
| W10 | `scripts/generate-index.sh` does bash/jq/sed templating — fragile | Low |
| W11 | All UI strings hardcoded English (no i18n) | Low |

---

## 3. Tech stack decision

### Keep

- **TypeScript (strict) + React 19** — current, appropriate. A Svelte/Solid/vanilla rewrite
  would burn weeks for zero user-visible benefit.
- **Bun** as package manager and script runner.
- **Vitest + Playwright** — both current major versions.
- **ESLint + Prettier** — fine. (Optional later: consolidate into Biome for speed and one
  less config; purely cosmetic, do not prioritize.)

### Replace

- **`scripts/build.ts` → WXT** (Vite-based extension framework). What it buys:
  - HMR for content scripts and options page (today: full rebuild + manual extension reload).
  - Manifest generated from config — kills the `src/manifest.json` version-injection dance.
  - First-class **Firefox + Chrome** builds (`wxt build -b firefox`) and `web-ext` signing.
  - Built-in zip packaging for store submission (today: ad-hoc in CI).
  - Maintained shadow-DOM content-script UI helpers (`createShadowRootUi`) — solves W2
    with framework support instead of hand-rolling.
  - Migration cost: ~1–2 days (entrypoint conventions, manifest config, CI script swap).
    Source code under `src/content`, `src/options`, `src/utils` moves essentially as-is.

### Explicitly rejected

- Full framework swap (Svelte/Solid/Preact), state libraries (Redux/Zustand — the singleton
  state in `state.ts` is adequate), CSS-in-JS libraries (inline style tokens work; shadow DOM
  + a plain stylesheet is simpler), monorepo tooling (single package, keep it flat).

---

## 4. Feature portfolio rethink (dev-first)

Positioning: **a productivity palette for developers working on GitHub** — issues, PRs,
reviews, CI. Fun features stay but stop being the center of gravity.

### Keep as-is

| Command | Rationale |
|---|---|
| `//` (command list) | Core discovery surface |
| `//emoji` | Daily-use, zero config |
| `//mention` | Context-aware, dev-relevant |
| `//link` (+ `//link ci`) | The blueprint for all GitHub-API features |
| `//mermaid` | Strongly dev-flavored; templates are useful |
| `//kbd` | Small, zero-maintenance |

### Modify

- **`//font` — trim.** Keep the honest markdown transforms (`#`/`##` headers, `<sub>`/`<sup>`).
  **Remove the LaTeX color hack** (W8): it depends on an undocumented MathJax quirk, renders
  as raw TeX in notification emails and on mobile, and is unreadable to assistive tech.
- **`//now` — keep but extend** with relative formats and ISO-8601/unix variants useful in
  bug reports ("reproduced at …").
- **`//giphy` — keep, demote.** It is the store-listing eye-catcher, but: API-key friction,
  external service, off-positioning. Move it last in the command list and make it clearly
  optional. (If maintenance cost grows — Giphy API changes, key policy — removal is on the
  table; not now.)

### Add (priority order)

1. **`//snippet`** — user-defined text snippets/saved replies with placeholders
   (`{date}`, `{repo}`, `{branch}`). Stored in `chrome.storage.local`, managed in the
   options page. No API, no token, huge daily value. *Best effort/value ratio in the plan.*
2. **`//issue` / `//pr`** — search issues/PRs in the current repo (GitHub REST search,
   reuses the existing PAT plumbing from `//link ci`) and insert `#123` or a full markdown
   link. This is the feature that makes the extension indispensable for triage work.
3. **`//suggest`** — insert a ` ```suggestion ` block pre-filled from context when writing
   PR review comments. Tiny implementation, very dev-flavored.
4. **`//details`** — collapsible `<details><summary>` block with cursor placed inside.
   Common need (long logs in bug reports), trivial to build.
5. **`//table`** — markdown table skeleton generator (pick rows×cols in the grid picker —
   the existing grid UI fits perfectly).
6. **`//commit`** — recent commits of the current repo/PR → insert SHA link. (Reuses
   `//issue` infrastructure; do after it.)
7. **`//coauthor`** — insert `Co-authored-by:` trailer from PR participants (reuses
   `//mention` data). Nice-to-have.

### Remove

- `utils/math.ts` `add`/`neg`/`sub` (keep `clamp`, move it or inline it) — W9.
- Deprecated `renderCurrent` from `CommandSpec` once `//`-list no longer needs it.
- `demo/` static artifacts if superseded by the deploy workflow's generated index.

---

## 5. Platform & robustness work

### P0 — survive GitHub's editor migration (W1)

- Abstract field access behind an `EditorAdapter` interface
  (`getValue/getCursor/replaceRange/getCaretRect/focus`), with two implementations:
  1. `TextareaAdapter` — current behavior, extracted from `utils/dom.ts`.
  2. `ContentEditableAdapter` — for GitHub's new React issue/PR editors (ProseMirror-style
     contenteditable). Detection: `[contenteditable="true"]` within known GitHub editor
     containers; insertion via `Range`/`InputEvent` so the page framework sees the change.
- Update `scanAndAttach` (`src/content/index.ts:373`) and the MutationObserver to match both.
- Add an E2E fixture replicating the contenteditable editor.

### P1 — isolation & resilience (W2, W3)

- Mount the picker in a **shadow root** (free with WXT's `createShadowRootUi`; ~a day by
  hand otherwise). Inline style tokens can stay initially; move to a stylesheet inside the
  shadow root afterwards.
- Wrap the picker tree in a **React error boundary** that fails closed (hide picker, leave
  the textarea untouched) and logs once.

### P1 — accessibility (W4)

- ARIA combobox pattern: `role="combobox"` semantics on the field association,
  `role="listbox"`/`role="option"` + `aria-activedescendant` in grid/list, `aria-live`
  announcements for result counts. Keyboard nav already exists — this is mostly attributes.

### P2 — network layer (W7)

- One small `fetchJson` wrapper in `utils/`: `AbortSignal.timeout(...)`, single retry with
  backoff on 5xx/network errors, typed error results. Adopt in `giphy/api.ts`,
  `link/api.ts`, `mention/api.ts`, `options/github/api.ts`.

### P2 — E2E overhaul (W5)

- Split `e2e/extension.spec.ts` (3,727 lines) into `e2e/<command>.spec.ts` + shared helpers.
- Replace every `waitForTimeout()` with locator-based waiting (`expect(...).toBeVisible()`).
- Load the extension the real way everywhere (persistent context + `--load-extension`),
  drop manual `addScriptTag` injection.
- Add the contenteditable fixture (see P0) to the matrix.

---

## 6. CI/CD & repo hygiene

Pipeline is already strong; only touch-ups:

- Replace `scripts/generate-index.sh` (bash/jq/sed) with a small TypeScript script (W10).
- Use Playwright's headless mode (`channel: "chromium"` supports extensions headless now)
  and drop the `xvfb-run` wrapper.
- Fail E2E loudly when `GIPHY_API_KEY` is absent instead of silently exercising the setup
  panel (explicit skip annotation).
- After WXT migration: `wxt zip` artifacts feed the existing release/publish workflows;
  add a Firefox build artifact alongside (publishing to AMO can come later).
- Add `concurrency` groups to CI workflows to cancel superseded runs (cheap win).

Deferred, revisit on demand: i18n (W11 — only if non-English user demand materializes),
Safari port, token encryption (chrome.storage.local is the platform-standard location;
document the trade-off in PRIVACY.md instead).

---

## 7. Phased roadmap

| Phase | Theme | Contents | Effort |
|---|---|---|---|
| **0** | Cleanup | Remove `math.ts` arithmetic, `renderCurrent`, `//font` color hack; fetch wrapper (W7); CI touch-ups | ~1–2 days |
| **1** | Platform survival | `EditorAdapter` + contenteditable support (P0); error boundary; E2E fixture for new editor | ~3–5 days |
| **2** | Build modernization | Migrate to WXT; shadow-DOM picker; Firefox build target; E2E split + de-flake | ~3–5 days |
| **3** | Dev features | `//snippet`, `//issue`, `//pr`, `//suggest`, `//details` (+ docs & E2E per command) | ~1–2 weeks, ship incrementally |
| **4** | Polish | A11y pass (ARIA combobox); `//table`, `//commit`, `//coauthor`; `//now` formats; AMO publishing | ongoing |

Phases 0–1 are independent of the WXT decision and should start regardless. Phase 1 before
Phase 2: working-on-new-GitHub beats nicer-builds if priorities collide.

---

## 8. Open questions

1. **Firefox**: is cross-browser a goal? It tilts the WXT decision from "recommended" to
   "obvious". (Plan assumes yes.)
2. **`//giphy`**: keep indefinitely, or sunset once dev features carry the store listing?
3. **Token scope strategy** for `//issue`/`//pr`: same PAT as `//link ci` (assumed), or move
   to fine-grained tokens / GitHub App later?
4. **`//font`**: trim to honest markdown (proposed) or remove the command entirely?
