# Codex Prompts

## Analyze A Sanitized Capture File

Review this sanitized ScopeGuard AI capture. Identify mapping-only entries, candidate findings, out-of-scope findings, and items that need owned-account proof. Do not infer a vulnerability without confirmed evidence.

## Decide If A Finding Is Reportable

Given the sanitized request metadata and program rules, decide whether this is report ready, needs more proof, mapping only, or out of scope. Be strict and do not invent impact.

## Draft A Report From Confirmed Evidence

Use the confirmed sanitized evidence to draft a report with title, summary, asset, vulnerability type, severity estimate, steps to reproduce, expected result, actual result, impact, evidence, remediation, and safety statement.

## Improve The Capture Rules

Suggest safe metadata-only capture rule improvements. Do not add fuzzing, brute force, exploit payloads, hidden path discovery, destructive tests, or high-volume scanning.

## Add A New Safe Plugin

Design a plugin that only supports authorized, low-volume, metadata-only mapping. Include scope guard rules, redaction rules, blocked actions, and evidence checklist behavior.

## Sanitize A Finding For Public Portfolio Use

Convert the finding into public-safe portfolio material:

- Real program name -> `Example Program`
- Real URL -> `https://demo-target.example`
- Real IDs -> `demo_id_123`
- Real screenshots -> placeholder
- Real report -> mock report
- Real exploit path -> high-level lesson only

Remove aliases, tokens, headers, account details, local paths, private notes, and any exact live-target workflow.
