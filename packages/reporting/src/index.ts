import type { CandidateFinding, ProjectConfig, ReportDraft } from "@scopeguard/core";

export function defaultSafetyStatement(): string {
  return "All testing was performed only on systems the researcher was authorized to test. The tool captured only redacted metadata and did not store passwords, cookies, authorization headers, session tokens, JWTs, payment data, or private customer data.";
}

export function generateReportDraft(input: {
  project: ProjectConfig;
  finding: CandidateFinding;
  evidenceConfirmed: boolean;
  actualResult?: string;
  impact?: string;
}): ReportDraft {
  if (!input.evidenceConfirmed) {
    throw new Error("Report drafts require confirmed reproducible evidence.");
  }

  return {
    title: `[${new URL(input.project.startUrl).hostname}] ${input.finding.type} allows specific impact`,
    summary: `${input.finding.title}. ${input.finding.reason}`,
    asset: input.project.startUrl,
    vulnerabilityType: input.finding.type,
    severityEstimate: input.finding.severityHint,
    cvssReasoning:
      "Attack Vector, Privileges Required, User Interaction, Scope, Confidentiality, Integrity, and Availability must be scored honestly based on confirmed evidence.",
    prerequisites: [
      "Researcher has explicit authorization for the target.",
      "Required User-Agent marker was used.",
      "No non-owned user data was accessed.",
      "No destructive testing was performed.",
    ],
    stepsToReproduce: [
      "Create or use authorized test accounts and follow the scoped program rules.",
      "Navigate to the affected feature.",
      "Capture the redacted request metadata.",
      "Perform only the confirmed safe proof step.",
      "Observe the actual result.",
    ],
    expectedResult: "The application should enforce server-side authorization and reject unauthorized object access.",
    actualResult: input.actualResult ?? "TBD from confirmed evidence.",
    impact: input.impact ?? "TBD from confirmed evidence.",
    evidence: ["Attach screenshots and redacted request/response snippets."],
    suggestedRemediation: [
      "Enforce server-side authorization checks on every object access.",
      "Verify resource ownership using the authenticated user identity.",
      "Never trust client-supplied IDs for authorization decisions.",
      "Return 403 or 404 for unauthorized cross-account access.",
      "Add regression tests for cross-account authorization.",
    ],
    safetyStatement: defaultSafetyStatement(),
    scopeStatement: `Testing was limited to ${input.project.allowedDomains.join(", ")}.`,
  };
}

export function reportToMarkdown(report: ReportDraft): string {
  return `# ${report.title}

## Summary

${report.summary}

## Asset

${report.asset}

## Vulnerability Type

${report.vulnerabilityType}

## Severity Estimate

${report.severityEstimate}

## CVSS Reasoning

${report.cvssReasoning}

## Prerequisites

${report.prerequisites.map((item) => `- ${item}`).join("\n")}

## Steps To Reproduce

${report.stepsToReproduce.map((item, index) => `${index + 1}. ${item}`).join("\n")}

## Expected Result

${report.expectedResult}

## Actual Result

${report.actualResult}

## Impact

${report.impact}

## Evidence

${report.evidence.map((item) => `- ${item}`).join("\n")}

## Suggested Remediation

${report.suggestedRemediation.map((item) => `- ${item}`).join("\n")}

## Safety Statement

${report.safetyStatement}

## Scope Statement

${report.scopeStatement}
`;
}
