<!--
Where is this PR going?
  feature  → version-1/2/3   new work for your team; your version lead reviews and merges
  feature  → test            promoting a chosen feature into the combined site; the repo owner reviews
  test     → main            releasing the combined site; repo owner only
  hotfix   → main            urgent production fix, branched from main; merged back into test afterwards
Feature branches start from your team's version branch (version-1, version-2 or version-3) and are named for
the team: v1/…, v2/…, v3/… (e.g. v2/custom-cursor). When the work is done, open the PR back into that same
version branch.
Delete the sections that don't apply to this PR.
-->

## What this changes

<!-- One or two sentences: what it is and why. Link the issue if there is one. -->

**Preview:** <!-- deployment link for this branch -->
**Screenshots / recording:** <!-- desktop and phone; a short screen recording for animations and interactions -->

## Every PR

- [ ] Branched from my team's `version-N` branch (hotfixes: from `main`), named `vN/…`, and this PR goes back into that same `version-N` branch
- [ ] Build check passes
- [ ] Checked on a desktop screen and a phone-sized screen
- [ ] Checked with reduced motion turned on (animations calm down or switch off)
- [ ] No errors in the browser console
- [ ] Text, names and links are in `src/content/`, not written into components

## Promotion into `test`

**From:** version-? · **Approved in:** #<!-- the version-branch PR where your lead approved this feature -->

- [ ] Approved by the version lead in the PR linked above
- [ ] Up to date with the latest `test`, and brings only this feature (nothing else from the version branch)
- [ ] Leaves the shared foundations alone: `tokens.json` / `src/styles/tokens.css`, `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/`, `src/content/`. Any change to them is listed below and agreed with the repo owner first
- [ ] Uses the site's design tokens (colours, fonts, easing), not values specific to one version
- [ ] Checked alongside what's already in `test`: navigation, page transitions and neighbouring pages still work

**Shared-foundation changes and new dependencies:** <!-- list each with the reason, or write "none" -->

## Release `test` → `main`

- [ ] Every page checked on the `test` preview, on desktop and on a phone
- [ ] Content checked against `CONTENT-NEEDED.md` (no unexpected "To be added" markers)
- [ ] Release tag to create after merging: `v0.?.?`
