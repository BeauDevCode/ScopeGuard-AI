# Public Repo Safety

ScopeGuard AI is designed to be a portfolio-ready authorized mapper and workflow assistant. The public repository should show product quality and safe engineering practices without becoming a disclosure dump.

## Safe To Publish

- Product source code.
- Sanitized mock examples.
- Fake target configs such as `https://demo-shop.example`.
- Fake capture outputs.
- Fake report examples.
- Placeholder screenshot references.
- Generic workflow descriptions.
- Public-safe statuses:
  - Mapping only
  - Needs owned-account proof
  - Out of scope
  - Candidate finding
  - Report ready
- Sanitized dashboard/demo datasets:
  - `examples/sanitized/demo-request-map.json`
  - `examples/sanitized/demo-candidates.json`
  - `examples/sanitized/demo-report-workflow.json`
  - `examples/sanitized/demo-program-profiles.json`

## Must Stay Private

- Real bounty aliases.
- Real account identifiers.
- Production capture logs.
- Live screenshots.
- Draft reports against real programs.
- Program notes from active research.
- Any credential, token, session, or private customer data.
- Exact target-specific testing plans or private submission notes.

Store private material under `private/`, which is gitignored.

## How To Sanitize Examples

- Replace real program names with `Example Program`.
- Replace real URLs with `https://demo-target.example`.
- Replace real IDs with `demo_id_123`.
- Replace real screenshots with placeholders.
- Replace real report language with mock report language.
- Replace exact exploit paths with a high-level lesson.
- Preserve the workflow shape, not the live target details.

## Secret Check Before Commit

Run:

```powershell
npm run public:safety
git status --short
git diff --cached
```

The public safety script prints informational hits for safety/redaction vocabulary and fails on possible leak markers such as private aliases, local paths, live capture markers, UUID-like public examples, or tracked private-looking paths.

Real aliases, production captures, local user paths, and target-specific notes must move to `private/`.

## Keeping Real Work Outside GitHub

- Keep `private/` for local research.
- Keep capture logs under ignored `captures/` or `private/captures/`.
- Keep private reports under `private/reports/`.
- Keep private screenshots under `private/screenshots/`.
- Never commit browser profiles.
- Never commit real request headers.
