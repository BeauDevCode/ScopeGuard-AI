# ScopeGuard AI

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![Tests](https://img.shields.io/badge/tests-Vitest-22c55e)
![React](https://img.shields.io/badge/React-19-61dafb)
![Playwright](https://img.shields.io/badge/Playwright-safe%20manual%20mapping-2e7d32)
![Safety](https://img.shields.io/badge/safety-authorized%20testing%20only-1f8f4d)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

**Authorized bug bounty workflow mapper**

ScopeGuard AI is a TypeScript, React, and Playwright-oriented portfolio project for authorized security researchers. It models program scope, captures redacted request metadata, identifies candidate findings, organizes evidence, and drafts mock reports only after confirmed reproducible demo proof exists.

It is built to show security judgment as much as code: strict scope checks, fake public examples, no secret storage, no exploit payloads, and report readiness gates that keep "candidate" separate from "confirmed."

> This app is an authorized safe mapper, not an exploit scanner.

## Showcase Blurb

ScopeGuard AI is an authorized bug bounty recon and safe web vulnerability mapping tool built with TypeScript, React, and Playwright. It helps researchers model scope, capture redacted request metadata, triage ownership-style IDs, and prepare responsible report workflows without storing secrets or adding exploit-scanner behavior.

## Legal And Safety Warning

Only use this tool on systems you own or are explicitly authorized to test. The user is responsible for following every program rule, engagement rule, law, and contract that applies.

Do **not** use ScopeGuard AI on random public websites. Do **not** use it for DoS, brute force, fuzzing, credential attacks, payment abuse, destructive testing, or accessing other users' data.

ScopeGuard AI saves only safe metadata. It must never save cookies, authorization headers, JWTs, passwords, refresh tokens, session cookies, payment data, private customer data, or full request headers.

## What It Does

- Creates authorization-first testing projects.
- Models allowed domains, disallowed paths, safe modes, blocked actions, and submission portals.
- Supports paste-link target validation for configured example programs.
- Redacts sensitive request metadata before analysis.
- Detects ownership-style identifiers such as `project_id=demo_project_123`.
- Labels findings as mapping only, needs owned-account proof, candidate finding, out of scope, or report ready after confirmed evidence.
- Keeps excluded classes non-reportable by default unless direct impact exists.
- Generates sanitized mock report drafts only when demo evidence is confirmed and checklist-ready.

## What It Does Not Do

- No automated vulnerability scanning.
- No fuzzing.
- No brute force.
- No password attacks or credential stuffing.
- No SQL injection payloads.
- No XSS payload spraying.
- No SSRF/RCE/LFI/XXE payloads.
- No destructive upload tests.
- No hidden directory brute force.
- No checkout, payment, refund, coupon, or gift-card abuse.
- No high-volume crawling.
- No report submission automation.

## Sample Data

The GitHub repo intentionally includes only sanitized demo data. Real captures, target notes, screenshots, draft reports, aliases, and private research notes belong in `private/`, which is gitignored.

Users should never commit live bounty data or secrets. ScopeGuard AI is a portfolio-ready authorized mapper and workflow assistant, not a disclosure dump.

Public examples use fake targets such as:

- `https://demo-shop.example`
- `https://demo-saas.example`
- `https://owned-lab.local`

Public-safe demo statuses include:

- Mapping only
- Needs owned-account proof
- Out of scope
- Candidate finding
- Report ready

The richer public demo data lives under `examples/sanitized/`:

- `demo-request-map.json` - fake redacted request metadata.
- `demo-candidates.json` - fake triage statuses for mapping, proof, candidate, out-of-scope, and report-ready states.
- `demo-report-workflow.json` - fake readiness checklist and mock report metadata.
- `demo-program-profiles.json` - fake program profiles using only demo hosts.
- `demo-report-output.example.md` - a public-safe mock report output.

## Safety Model

ScopeGuard AI is built around explicit authorization, least-data capture, and candidate-only triage.

- A project must define a valid start URL, allowed domains, rate limits, a marker or accepted default, and explicit authorization confirmation.
- The app is designed to store metadata, not secrets.
- Redaction rules treat cookies, tokens, sessions, passwords, payment data, private identifiers, and long opaque values as sensitive.
- Candidate findings are not report drafts until a researcher confirms reproducible impact using only authorized accounts and safe evidence.
- Out-of-scope classes such as DoS, cookie replay, user enumeration, tenant enumeration, dependency confusion, and subdomain takeover are blocked or triaged as non-reportable by default.

## Architecture

```text
apps/web/              Vite + React dashboard and workflow UI
packages/core/         project config types, normalization, validation, candidate states
packages/rules/        scope checks, paste-link validation, redaction, request classification
packages/reporting/    report-readiness checklist and mock report generation
examples/              sanitized public demo profiles and outputs
scripts/               public safety scan and safe mapper CLI
docs/                  safety notes, screenshot guide, report template, Codex prompts
```

The root package uses npm workspaces. The web app imports the local packages directly, so validation rules and report-readiness logic are testable outside the UI.

## Workflow Model

ScopeGuard treats the workflow as a gated state machine:

1. **Project draft** - user enters program name, start URL, allowed domains, blocked paths, marker/header requirements, and authorization notes.
2. **Validated project** - `validateProjectConfig` blocks missing authorization, invalid URLs, empty allowed-domain lists, missing markers, and unsafe rate-limit defaults.
3. **Safe target intake** - `validatePasteTargetUrl` checks pasted URLs against allowed roots and requires documented authenticated-flow evidence for strict subdomain cases.
4. **Request metadata review** - request maps store redacted metadata, visible IDs, feature guesses, and safety notes; secrets and private data are not retained.
5. **Candidate triage** - findings remain `mapping only`, `needs owned-account proof`, `candidate finding`, or `out of scope` until evidence is confirmed.
6. **Report ready** - report drafts require scope, authorization, reproducibility, impact, redacted evidence, screenshots/media, and out-of-scope checks.

## Install

```bash
git clone https://github.com/BeauDevCode/ScopeGuard-AI.git
cd ScopeGuard-AI
npm install
```

CI uses Node.js 22. On Windows systems where PowerShell blocks `npm.ps1`, run the same commands with `npm.cmd`.

## Quick Start

Run the local web UI:

```bash
npm run web
```

Or use the root alias:

```bash
npm run dev
```

Then open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Demo Workflow

1. Open the dashboard and review the Safe by Design guardrails.
2. Choose a sanitized example profile such as Demo Shop or Owned Lab.
3. Paste a fake target URL such as `https://demo-shop.example`.
4. Confirm the authorization checkbox.
5. Review allowed domains, blocked actions, required marker/header, and safe mode.
6. Start the public demo mapping state. The UI does not launch real target automation by default.
7. Review request-map, candidate-triage, and report-readiness examples.

## Testing and Validation

```bash
npm ci
npm run test
npm run lint
npm run typecheck
npm run build
npm run public:safety
npm audit --audit-level=critical
```

Run the local UI:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Then open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Fresh-clone validation for this pass used `npm.cmd` on Windows: install from lockfile, tests, lint, typecheck, build, public safety scan, critical audit check, and a Vite dev-server smoke test all passed.

## Available Scripts

```bash
npm run dev
npm run web
npm run build
npm run safe:mapper -- --profile examples/demo-shop.example.json --target https://demo-shop.example --handle demo-researcher
npm run report -- --project examples/demo-shop.example.json
npm run public:safety
npm run test
npm run lint
npm run typecheck
npm run build
```

## Creating A Project

Create a project with:

- Project name
- Optional researcher marker
- Submission portal
- Out-of-scope vulnerability classes
- Target start URL
- Allowed domains and subdomains
- Disallowed paths
- Program URL or internal authorization note
- Required marker or header
- Rate limit setting
- Testing mode
- Authorization confirmation checkbox

ScopeGuard AI refuses to run unless the target URL is valid, allowed domains are present, rate limits are configured, the marker is set or accepted, and the user confirms authorization.

## Example Program Profiles

ScopeGuard AI ships with sanitized public profiles that demonstrate how authorization rules, scope, safe modes, and reporting workflows can be modeled.

- `examples/demo-shop.example.json` - paste-link mapping and P3/P2-style candidate triage using fake targets.
- `examples/demo-saas.example.json` - simple scoped application profile.
- `examples/local-lab.example.json` - local intentionally vulnerable lab example.
- `examples/sanitized/` - fake capture, analysis, report-ready, mapping-only, and out-of-scope outputs.

## Why I Built This

Bug bounty tooling often drifts toward scanner behavior or private notes that cannot be shown publicly. ScopeGuard AI is a portfolio-safe way to demonstrate responsible reconnaissance workflows: scope validation, least-data capture, careful triage, and disciplined report readiness.

## What I Learned

- How to encode program-scope and authorization rules as testable TypeScript primitives.
- How to separate useful security metadata from secrets and private research artifacts.
- How to design triage language that avoids overstating unconfirmed findings.
- How to package a security project so it is understandable to recruiters without exposing real bounty work.

## Portfolio Value

ScopeGuard AI demonstrates:

- TypeScript monorepo architecture.
- Playwright-oriented safe browser automation design.
- React dashboard and product UX design.
- Bug bounty scope modeling.
- Request metadata redaction.
- Vulnerability candidate triage.
- Report drafting workflow.
- Public/private research-data separation.
- Security-focused developer experience with tests, linting, typecheck, build, CI, and public-safety checks.

## Limitations

- This is a workflow and safety-modeling app, not an automated scanner.
- The UI uses sanitized demo profiles and fake targets only.
- There is no persistent database or multi-user account system yet.
- The current public workflow does not launch real browser automation by default.
- Report drafts are mock outputs and must not be used as real bounty submissions without authorized, reproducible evidence.

## Screenshots

No real screenshots are committed yet. Screenshot capture guidance lives in `docs/screenshots/README.md`.

| Workflow state | Placeholder path | Shows |
| --- | --- | --- |
| Dashboard overview | `docs/screenshots/dashboard-overview.png` | Hero, stats, Safe by Design panel, workflow overview |
| In-scope paste target | `docs/screenshots/paste-target-in-scope.png` | Demo Shop profile with `https://demo-shop.example` allowed and authorization checked |
| Out-of-scope paste target | `docs/screenshots/paste-target-out-of-scope.png` | Fake host such as `https://outside.example` blocked |
| Candidate statuses | `docs/screenshots/candidate-statuses.png` | Mapping, proof-needed, candidate, out-of-scope, and report-ready badges |
| Request map | `docs/screenshots/request-map-preview.png` | Sanitized metadata table with fake IDs |
| Report readiness | `docs/screenshots/report-readiness.png` | Checklist with pending media item |
| Mobile dashboard | `docs/screenshots/mobile-dashboard.png` | Responsive layout at a mobile width |

## Workflow

1. Create a scoped authorized project.
2. Start safe mapping.
3. Log in manually if needed.
4. Map normal UI features only.
5. Review request map and candidate panel.
6. Collect proof manually using owned or authorized accounts.
7. Mark evidence as confirmed only when reproducible.
8. Generate a report draft.
9. Submit manually through the relevant platform.

## Using With Codex, OpenCode, Or Hermes

Export sanitized `captures/<project>/capture.md` or `captures/<project>/capture.jsonl`, then ask your assistant to analyze only the redacted metadata. Never paste cookies, tokens, passwords, private data, or full headers.

## Roadmap

- Add real public-safe screenshots and a short workflow GIF.
- Add a safe Playwright capture package for manual browser sessions.
- Add project persistence through a small API service.
- Add evidence bundle export with redaction checks.
- Add per-program rule templates and a simple CVSS helper.

## License

MIT
