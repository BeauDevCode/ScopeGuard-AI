export type TestingMode =
  | "passive-map-only"
  | "safe-ui-mapping"
  | "authenticated-manual-session-mapping"
  | "lab-mode";

export interface RateLimitConfig {
  minDelayMs: number;
  maxActionsPerRun: number;
  maxPagesPerRun: number;
}

export interface ProjectConfig {
  id?: string;
  name: string;
  programName?: string;
  platform?: string;
  submissionPortal?: string;
  startUrl: string;
  inScopeTargets?: string[];
  allowedDomains: string[];
  disallowedPaths: string[];
  authorizationNote: string;
  bugBountyProgramUrl?: string;
  researchAccountMarker?: string;
  requiredResearchNote?: string;
  userAgentMarker: string;
  requiredHeaders?: Record<string, string>;
  optionalHeaders?: Record<string, string>;
  authEmailRule?: string;
  rateLimit: RateLimitConfig;
  testingMode: TestingMode;
  triageMode?: string;
  safeModes?: string[];
  defaultMode?: string;
  productsInScope?: string[];
  blockedFindings?: string[];
  blockedActions?: string[];
  outOfScopeExamples?: string[];
  outOfScopeVulnerabilityClasses?: string[];
  highValueImpacts?: string[];
  priorityFindings?: string[];
  payoutFocus?: string;
  rewardMin?: number;
  rewardMax?: number;
  rewardRangeUsd?: {
    min: number;
    max: number;
  };
  notes?: string[];
  strictScopeHosts?: boolean;
  labMode?: boolean;
  allowAdminPaths?: boolean;
  confirmedAuthorization: boolean;
}

export interface RawProjectConfig extends Partial<ProjectConfig> {
  projectName?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export interface CapturedRequest {
  timestamp: string;
  projectId: string;
  targetHost: string;
  featureGuess: FeatureClass;
  method: string;
  path: string;
  queryParameters: Record<string, string>;
  bodyParameters: Record<string, string>;
  statusCode: number | null;
  resourceType: string;
  responseBehavior: string;
  visibleIds: DetectedIdentifier[];
  securityNotes?: SecurityNote[];
  secretsRedacted: "yes";
}

export type FeatureClass =
  | "auth"
  | "account/profile"
  | "address"
  | "cart/basket"
  | "wishlist/favorite"
  | "order history"
  | "documents"
  | "notifications"
  | "support/contact"
  | "search"
  | "product/content"
  | "admin-looking"
  | "unknown";

export type IdentifierKind =
  | "product/content ID"
  | "session/cart line item ID"
  | "possible ownership ID"
  | "possible sensitive object ID"
  | "unknown";

export interface DetectedIdentifier {
  key: string;
  value: string;
  kind: IdentifierKind;
  source: "path" | "query" | "body";
}

export type CandidateType =
  | "IDOR candidate"
  | "Broken access control candidate"
  | "Business logic candidate"
  | "Open redirect candidate"
  | "CORS candidate"
  | "CSRF candidate"
  | "XSS marker reflection candidate"
  | "Sensitive data exposure candidate"
  | "Auth/session weakness candidate"
  | "Header/cookie hygiene note"
  | "Not reportable / informational";

export type CandidateStatus =
  | "mapping only"
  | "needs owned-account proof"
  | "candidate finding"
  | "out of scope"
  | "report ready";

export const CANDIDATE_STATUS_EXPLANATIONS: Record<CandidateStatus, string> = {
  "mapping only": "Safe metadata was observed, but there is no vulnerability evidence yet.",
  "needs owned-account proof":
    "Ownership-style IDs or sensitive objects were mapped; reportability requires a safe comparison using owned authorized accounts.",
  "candidate finding": "Evidence suggests a possible issue, but impact and reproducibility are not fully confirmed.",
  "out of scope": "The mapped class is excluded, hygiene-only, dangerous, or blocked by program rules.",
  "report ready": "Scope, authorization, reproducibility, impact, and redacted evidence are all confirmed.",
};

export interface CandidateFinding {
  id: string;
  projectId: string;
  type: CandidateType;
  status: CandidateStatus;
  title: string;
  feature: FeatureClass;
  evidenceRequestIds: string[];
  reason: string;
  proofPlan: string[];
  severityHint: "info" | "low" | "medium" | "high" | "critical";
}

export interface SecurityNote {
  type: "security-header" | "cookie-attribute" | "cors" | "technology" | "scope";
  label: string;
  detail: string;
  reportable: boolean;
}

export interface ReportDraft {
  title: string;
  summary: string;
  asset: string;
  vulnerabilityType: string;
  severityEstimate: string;
  cvssReasoning: string;
  prerequisites: string[];
  stepsToReproduce: string[];
  expectedResult: string;
  actualResult: string;
  impact: string;
  evidence: string[];
  suggestedRemediation: string[];
  safetyStatement: string;
  scopeStatement: string;
}

export function normalizeTestingMode(value: unknown): TestingMode {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "passive map only" || normalized === "passive-map-only") {
    return "passive-map-only";
  }
  if (normalized === "authenticated manual session mapping") {
    return "authenticated-manual-session-mapping";
  }
  if (normalized === "lab mode" || normalized === "lab-mode") {
    return "lab-mode";
  }
  return "safe-ui-mapping";
}

export function normalizeProjectConfig(raw: RawProjectConfig): ProjectConfig {
  const name = raw.name || raw.projectName || "";
  const researchMarker = raw.researchAccountMarker?.trim();

  return {
    id: raw.id,
    name,
    programName: raw.programName,
    platform: raw.platform,
    submissionPortal: raw.submissionPortal,
    startUrl: raw.startUrl || "",
    inScopeTargets: raw.inScopeTargets,
    allowedDomains: raw.allowedDomains || [],
    disallowedPaths: raw.disallowedPaths || [],
    authorizationNote: raw.authorizationNote || raw.requiredResearchNote || "",
    bugBountyProgramUrl: raw.bugBountyProgramUrl,
    researchAccountMarker: researchMarker,
    requiredResearchNote: raw.requiredResearchNote,
    userAgentMarker: raw.userAgentMarker || (researchMarker ? `ScopeGuard-AI ${researchMarker}` : "ScopeGuard-AI"),
    requiredHeaders: raw.requiredHeaders,
    optionalHeaders: raw.optionalHeaders,
    authEmailRule: raw.authEmailRule,
    rateLimit: raw.rateLimit || {
      minDelayMs: 1500,
      maxActionsPerRun: 25,
      maxPagesPerRun: 10,
    },
    testingMode: normalizeTestingMode(raw.testingMode || raw.defaultMode),
    triageMode: raw.triageMode,
    safeModes: raw.safeModes,
    defaultMode: raw.defaultMode,
    productsInScope: raw.productsInScope,
    blockedFindings: raw.blockedFindings,
    blockedActions: raw.blockedActions,
    outOfScopeExamples: raw.outOfScopeExamples,
    outOfScopeVulnerabilityClasses: raw.outOfScopeVulnerabilityClasses,
    highValueImpacts: raw.highValueImpacts,
    priorityFindings: raw.priorityFindings,
    payoutFocus: raw.payoutFocus,
    rewardMin: raw.rewardMin,
    rewardMax: raw.rewardMax,
    rewardRangeUsd: raw.rewardRangeUsd,
    notes: raw.notes,
    strictScopeHosts: raw.strictScopeHosts,
    labMode: raw.labMode,
    allowAdminPaths: raw.allowAdminPaths,
    confirmedAuthorization: raw.confirmedAuthorization ?? false,
  };
}

export function validateResearchMarker(marker: string | undefined): ValidationResult {
  if (!marker?.trim()) return { ok: true, errors: [] };
  if (!/^[A-Z0-9_-]{2,32}$/i.test(marker)) {
    return {
      ok: false,
      errors: ["Research account / tenant marker must be 2-32 safe characters."],
    };
  }
  return { ok: true, errors: [] };
}

export function validateProjectConfig(config: ProjectConfig): ValidationResult {
  const errors: string[] = [];

  if (!config.name.trim()) errors.push("Project name is required.");

  try {
    const url = new URL(config.startUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      errors.push("Target start URL must use http or https.");
    }
  } catch {
    errors.push("Target start URL must be valid.");
  }

  if (!config.allowedDomains.length) {
    errors.push("At least one allowed domain is required.");
  }

  if (!config.confirmedAuthorization) {
    errors.push("Authorization confirmation is required.");
  }

  if (!config.userAgentMarker.trim()) {
    errors.push("User-Agent marker is required.");
  }

  const markerValidation = validateResearchMarker(config.researchAccountMarker);
  errors.push(...markerValidation.errors);

  if (!Number.isFinite(config.rateLimit.minDelayMs) || config.rateLimit.minDelayMs < 500) {
    errors.push("Minimum delay must be at least 500ms.");
  }

  if (!Number.isInteger(config.rateLimit.maxActionsPerRun) || config.rateLimit.maxActionsPerRun < 1) {
    errors.push("Max actions per run must be configured.");
  }

  if (!Number.isInteger(config.rateLimit.maxPagesPerRun) || config.rateLimit.maxPagesPerRun < 1) {
    errors.push("Max pages per run must be configured.");
  }

  return { ok: errors.length === 0, errors };
}
