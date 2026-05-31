# ScopeGuard AI App Audit And Upgrade Plan

## 1. Current Strengths

- Clear safety-first positioning: authorized testing only, metadata-only capture, and no exploit-scanner claim.
- TypeScript monorepo with separate `core`, `rules`, `reporting`, and `web` workspaces.
- Existing tests covered profile validation, paste-link scope checks, blocked actions, and ordered report-template steps.
- Public/private split was already present through `.gitignore` entries for `private/`, `captures/`, browser profiles, reports, screenshots, and capture artifacts.
- Demo examples already used fake `.example` targets and fake IDs.

## 2. Bugs Or Weaknesses Found

- The web UI looked more like a form than a product dashboard, so the project value was not obvious within the first few seconds.
- Paste-link mode had useful validation but did not clearly show allowed domains, blocked actions, required headers, safe modes, or demo-only behavior in one organized flow.
- Candidate status language was close but not aligned with the portfolio-facing states: mapping only, needs owned-account proof, candidate finding, out of scope, and report ready.
- Header and cookie hygiene findings were not surfaced as explicit out-of-scope hygiene notes in candidate classification.
- Reporting generated drafts from any confirmed evidence shape instead of clearly limiting public report generation to sanitized demo projects and checklist-ready evidence.
- `packages/reporting/src/cli.ts` logged the `reportToMarkdown` function reference while writing the placeholder report.
- `public:safety` passed but produced noisy warnings for normal safety words such as `cookie`, `authorization`, and `password`.
- README had a strong safety foundation but needed a sharper pitch, recruiter-facing narrative, demo workflow, and screenshot guidance.

## 3. Upgrade Priorities

1. Make the web app read as a polished, safe product dashboard.
2. Make paste-link target intake clearer and explicitly demo-only.
3. Add richer sanitized demo datasets.
4. Align candidate triage statuses with the visible product language.
5. Add report readiness checklist behavior and public-safe mock report generation.
6. Improve public repository safety scanning.
7. Expand tests around redaction, triage, report readiness, and sanitized examples.
8. Improve README, SECURITY, CONTRIBUTING, screenshot guidance, and CI.

## 4. Changes Implemented

- Rebuilt the React UI with a polished hero, demo stats, Safe by Design panel, Scope -> Map -> Triage -> Report workflow overview, status badges, request-map preview, report-readiness preview, and a more complete paste-target intake screen.
- Added visual indicators for redacted metadata only, no secrets stored, and authorized testing only.
- Paste-target mode now shows selected example profile, target URL validation, allowed domains, blocked actions, required marker/header, safe mode, authorization checkbox, authenticated-flow evidence note, and a disabled safe mapping button until checks pass.
- Added candidate status explanations in `@scopeguard/core`.
- Updated candidate classification in `@scopeguard/rules` to use `needs owned-account proof`, keep product/content IDs out of ownership findings, and classify header/cookie hygiene as out of scope by default.
- Added report readiness checklist functions and restricted public report draft generation to sanitized demo projects.
- Fixed the reporting CLI placeholder logging bug.
- Added richer sanitized public examples:
  - `examples/sanitized/demo-request-map.json`
  - `examples/sanitized/demo-candidates.json`
  - `examples/sanitized/demo-report-workflow.json`
  - `examples/sanitized/demo-program-profiles.json`
  - `examples/sanitized/demo-report-output.example.md`
- Reworked `scripts/check-public-safety.ps1` to separate informational safety vocabulary from serious leak markers and to fail on serious findings.
- Expanded tests for status explanations, sanitized examples, redaction, product/content ID classification, hygiene notes, and report readiness.
- Updated README, SECURITY, CONTRIBUTING, public safety docs, screenshot guidance, and GitHub Actions.

## 5. Changes Intentionally Not Implemented

- No exploit modules, fuzzing, brute force, payload libraries, hidden-directory discovery, payment testing, credential attacks, destructive tests, or high-volume scanning.
- No report auto-submission.
- No real target examples, real bounty notes, private captures, screenshots, aliases, logs, browser profiles, or draft reports.
- No backend service or paid API integration.
- No binary screenshots were generated in this pass; screenshot capture guidance was documented instead.

## 6. Test Results

- Baseline before changes:
  - `npm.cmd run test`: passed, 18 tests.
  - `npm.cmd run lint`: passed.
  - `npm.cmd run typecheck`: passed.
  - `npm.cmd run public:safety`: passed with informational/noisy warnings.
- Final after changes:
  - `npm.cmd install`: passed; packages up to date, 0 vulnerabilities.
  - `npm.cmd run test`: passed, 3 test files and 26 tests.
  - `npm.cmd run lint`: passed.
  - `npm.cmd run typecheck`: passed.
  - `npm.cmd run build`: passed; Vite production build completed.
  - `npm.cmd run public:safety`: passed; 51 files scanned, 71 informational safety-term hits, 0 possible leak findings.
  - Browser smoke check: passed at desktop and mobile widths; no horizontal overflow, key sections rendered, paste-target out-of-scope blocking worked, and in-scope authorized demo start stayed demo-only.

## 7. Safety/Privacy Verification

- `git ls-files` literal-pattern check before changes returned no tracked private paths or known private markers.
- `.gitignore` excludes `private/`, `captures/`, browser profiles, private reports, private screenshots, HAR/database files, and capture/log artifacts.
- New public data uses fake demo hosts only:
  - `https://demo-shop.example`
  - `https://demo-saas.example`
  - `https://owned-lab.local`
- New public data uses fake demo IDs only:
  - `demo_project_123`
  - `demo_user_456`
  - `demo_ticket_789`
  - `demo_file_111`
- No private research data was intentionally read, copied, staged, or committed.
- Final `public:safety` verification passed with 0 possible leak findings.
- Final tracked private-data check is performed immediately before commit/push.

## 8. Future Roadmap

- Add non-binary screenshot assets after manually capturing the sanitized dashboard.
- Add a persistence layer for local-only project drafts with explicit private storage warnings.
- Add more safe lab-mode examples using fake owned-lab profiles.
- Add accessibility regression checks for the dashboard.
- Add a lightweight, public-safe browser capture demo that records only redacted metadata from owned local labs.
- Add a case-study page showing architecture, safety constraints, and lessons learned.
