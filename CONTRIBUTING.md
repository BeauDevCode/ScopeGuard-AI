# Contributing

Thanks for helping improve ScopeGuard AI.

## Safety First

Contributions must preserve the authorization-first safety model. Do not add exploit modules, fuzzers, brute-force tools, credential attacks, destructive tests, or hidden endpoint brute forcing.

## Development

```bash
npm install
npm run test
npm run lint
```

## Pull Requests

- Keep changes scoped.
- Add tests for rule, redaction, scope, or report behavior.
- Update docs when safety behavior changes.
- Do not commit captures, browser profiles, cookies, tokens, or secrets.
