import type { CandidateFinding, ProjectConfig, ReportDraft } from "@scopeguard/core";

const PUBLIC_SAFE_DEMO_HOSTS = new Set(["demo-shop.example", "demo-saas.example", "owned-lab.local"]);

export type ReportReadinessKey =
  | "in-scope"
  | "authorized"
  | "reproducible"
  | "impact-clear"
  | "evidence-redacted"
  | "screenshots-ready"
  | "out-of-scope-checked";

export interface ReportReadinessItem {
  id: ReportReadinessKey;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ReportReadinessChecklist {
  ready: boolean;
  items: ReportReadinessItem[];
  missing: string[];
}

export interface ReportReadinessInput {
  project: ProjectConfig;
  finding: CandidateFinding;
  evidenceConfirmed: boolean;
  authorized?: boolean;
  reproducible?: boolean;
  impact?: string;
  evidenceRedacted?: boolean;
  screenshotsReady?: boolean;
  outOfScopeChecked?: boolean;
}

export function defaultSafetyStatement(): string {
  return "All testing was performed only on systems the researcher was authorized to test. The tool captured only redacted metadata and did not store passwords, cookies, authorization headers, session tokens, JWTs, payment data, or private customer data.";
}

export function generateReportDraft(input: {
  project: ProjectConfig;
  finding: CandidateFinding;
  evidenceConfirmed: boolean;
  authorized?: boolean;
  reproducible?: boolean;
  actualResult?: string;
  impact?: string;
  evidenceRedacted?: boolean;
  screenshotsReady?: boolean;
  outOfScopeChecked?: boolean;
}): ReportDraft {
  if (!input.evidenceConfirmed) {
    throw new Error("Report drafts require confirmed reproducible evidence.");
  }

  if (!isSanitizedDemoProject(input.project)) {
    throw new Error("Public report drafts are limited to sanitized demo projects.");
  }

  const checklist = buildReportReadinessChecklist(input);
  if (!checklist.ready) {
    throw new Error(`Report draft is not ready: ${checklist.missing.join(", ")}`);
  }

  return {
    title: `[${new URL(input.project.startUrl).hostname}] Mock ${input.finding.type} report from confirmed demo evidence`,
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

export function buildReportReadinessChecklist(input: ReportReadinessInput): ReportReadinessChecklist {
  const inScope = isProjectStartInScope(input.project) && isSanitizedDemoProject(input.project);
  const authorized = input.authorized ?? input.project.confirmedAuthorization;
  const reproducible = input.reproducible ?? input.evidenceConfirmed;
  const impactClear = Boolean(input.impact?.trim());
  const evidenceRedacted = input.evidenceRedacted ?? true;
  const screenshotsReady = input.screenshotsReady ?? false;
  const outOfScopeChecked = input.outOfScopeChecked ?? false;

  const items: ReportReadinessItem[] = [
    {
      id: "in-scope",
      label: "In scope?",
      passed: inScope,
      detail: inScope
        ? "The asset is in a sanitized demo profile."
        : "The asset must belong to an allowed sanitized demo host.",
    },
    {
      id: "authorized",
      label: "Authorized?",
      passed: authorized,
      detail: authorized
        ? "Authorization has been explicitly confirmed."
        : "Authorization must be confirmed before report drafting.",
    },
    {
      id: "reproducible",
      label: "Reproducible?",
      passed: reproducible,
      detail: reproducible
        ? "The behavior is confirmed and repeatable in demo evidence."
        : "A finding remains candidate-only until reproducible evidence exists.",
    },
    {
      id: "impact-clear",
      label: "Impact clear?",
      passed: impactClear,
      detail: impactClear ? "Impact is summarized in plain language." : "Impact must be specific and evidence-backed.",
    },
    {
      id: "evidence-redacted",
      label: "Evidence redacted?",
      passed: evidenceRedacted,
      detail: evidenceRedacted ? "Evidence is redacted metadata only." : "Evidence must not include secrets or private data.",
    },
    {
      id: "screenshots-ready",
      label: "Screenshots/video ready?",
      passed: screenshotsReady,
      detail: screenshotsReady
        ? "Supporting media placeholders are ready for the demo workflow."
        : "Add sanitized media placeholders before calling the draft report ready.",
    },
    {
      id: "out-of-scope-checked",
      label: "Out-of-scope exclusions checked?",
      passed: outOfScopeChecked,
      detail: outOfScopeChecked
        ? "Excluded classes were checked before report drafting."
        : "Confirm the finding is not a blocked or hygiene-only class.",
    },
  ];

  return {
    ready: items.every((item) => item.passed),
    items,
    missing: items.filter((item) => !item.passed).map((item) => item.label),
  };
}

export function isSanitizedDemoProject(project: ProjectConfig): boolean {
  return getProjectHosts(project).every((host) => PUBLIC_SAFE_DEMO_HOSTS.has(host));
}

function isProjectStartInScope(project: ProjectConfig): boolean {
  try {
    const startHost = new URL(project.startUrl).hostname.toLowerCase();
    return project.allowedDomains.some((domain) => domain.toLowerCase() === startHost);
  } catch {
    return false;
  }
}

function getProjectHosts(project: ProjectConfig): string[] {
  const hosts = new Set(project.allowedDomains.map((domain) => domain.toLowerCase()));
  try {
    hosts.add(new URL(project.startUrl).hostname.toLowerCase());
  } catch {
    hosts.add(project.startUrl.toLowerCase());
  }
  return [...hosts];
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
