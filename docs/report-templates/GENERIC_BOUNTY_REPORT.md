# Generic Bounty Report Template

Title:
[Example Program] [Vulnerability Type] allows [specific confirmed impact]

Asset:
`https://demo-target.example`

Priority estimate:
[Low / Medium / High with honest reasoning]

Readiness checklist:

- In scope?
- Authorized?
- Reproducible?
- Impact clear?
- Evidence redacted?
- Screenshots/video ready?
- Out-of-scope exclusions checked?

Summary:
[Two to four sentences describing confirmed behavior.]

Security impact:
[Explain direct impact. Do not exaggerate.]

Steps To Reproduce:

1. Log into owned demo Account A.
2. Navigate to the affected feature.
3. Capture the relevant redacted request metadata.
4. Log into owned demo Account B if comparison proof is required.
5. Capture the equivalent Account B request.
6. Return to Account A and send one safe comparison request.
7. Observe the actual result.

Expected Result:
Account A should receive `403`, `404`, or access denied for Account B's resource.

Actual Result:
[Confirmed result goes here.]

Evidence:

- Screenshot placeholder:
- Redacted request placeholder:
- Redacted response placeholder:

Affected account/test data:
Owned demo accounts only.

Scope confirmation:
Testing was limited to the configured authorized demo target.

Rules confirmation:
No destructive testing, payment abuse, credential attacks, high-volume traffic, or access to non-owned data was performed.

Suggested remediation:
Enforce server-side authorization and verify object ownership using the authenticated identity.

Safety statement:
This public template uses fake demo data and contains no live bounty details, secrets, account identifiers, or target-specific exploit paths.
