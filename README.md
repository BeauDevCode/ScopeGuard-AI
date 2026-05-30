# ScopeGuard AI

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![Safety](https://img.shields.io/badge/safety-authorized%20testing%20only-1f8f4d)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

**Authorized Bug Bounty Recon & Safe Web Vulnerability Mapper**

ScopeGuard AI is a professional TypeScript portfolio project for authorized security researchers. It models scope, captures redacted request metadata, identifies candidate findings, organizes evidence, and drafts reports only after confirmed reproducible proof exists.

> This app is an authorized safe mapper, not an exploit scanner.

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
- Labels findings as mapping-only, needs-proof, candidate-only, out-of-scope, or report-ready after confirmed evidence.
- Keeps excluded classes non-reportable by default unless direct impact exists.
- Generates report drafts only when evidence is confirmed.

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

## Public Demo vs Private Research Data

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
- Report ready after confirmed evidence

## Safety Model

ScopeGuard AI is built around explicit authorization, least-data capture, and candidate-only triage.

- A project must define a valid start URL, allowed domains, rate limits, a marker or accepted default, and explicit authorization confirmation.
- The app is designed to store metadata, not secrets.
- Redaction rules treat cookies, tokens, sessions, passwords, payment data, private identifiers, and long opaque values as sensitive.
- Candidate findings are not report drafts until a researcher confirms reproducible impact using only authorized accounts and safe evidence.
- Out-of-scope classes such as DoS, cookie replay, user enumeration, tenant enumeration, dependency confusion, and subdomain takeover are blocked or triaged as non-reportable by default.

## Install

```bash
git clone https://github.com/BeauDevCode/ScopeGuard-AI.git
cd ScopeGuard-AI
npm install
```

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

## Verification

```bash
npm run test
npm run lint
npm run typecheck
npm run public:safety
```

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

## Portfolio Value

ScopeGuard AI demonstrates:

- TypeScript monorepo architecture.
- Playwright-oriented safe browser automation design.
- Bug bounty scope modeling.
- Request metadata redaction.
- Vulnerability candidate triage.
- Report drafting workflow.
- Public/private research-data separation.

## Screenshots

Screenshots can be added under `docs/screenshots/` before public launch:

- `docs/screenshots/new-project.png` - New project and authorization form.
- `docs/screenshots/paste-target.png` - Paste-link target validation.
- `docs/screenshots/request-map.png` - Request metadata map.
- `docs/screenshots/candidates.png` - Candidate triage panel.
- `docs/screenshots/report-draft.png` - Report draft workflow.

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

- Safe Playwright capture package for manual browser sessions.
- Express API service for project persistence.
- Browser extension handoff for richer manual capture.
- Evidence bundle export.
- Per-program rule templates.
- Optional CVSS calculator UI.
- More safe lab-mode integrations.

## License

MIT
