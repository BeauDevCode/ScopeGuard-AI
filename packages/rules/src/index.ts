import type {
  CandidateFinding,
  CapturedRequest,
  DetectedIdentifier,
  FeatureClass,
  IdentifierKind,
  ProjectConfig,
  SecurityNote,
} from "@scopeguard/core";

export const REDACTED = "[redacted]";

export const DANGEROUS_TEXT = [
  "dos",
  "denial of service",
  "high-volume traffic",
  "brute force",
  "bruteforce",
  "fuzzing",
  "credential attacks",
  "credential stuffing",
  "cookie replay",
  "user enumeration",
  "tenant enumeration",
  "dependency confusion",
  "subdomain takeover",
  "chatbox",
  "chatbox testing",
  "live chat",
  "chat with us",
  "checkout",
  "pay",
  "payment",
  "domain purchase",
  "purchase domain",
  "register domain",
  "destructive action",
  "destructive testing",
  "place order",
  "buy now",
  "paypal",
  "klarna",
  "apple pay",
  "google pay",
  "credit card",
  "bank",
  "refund",
  "coupon",
  "voucher",
  "gift card",
  "delete account",
  "close account",
  "transfer",
  "withdraw",
  "deposit",
  "submit order",
  "confirm purchase",
  "cancel order",
  "wire",
  "kyc",
  "ssn",
  "tax",
  "identity verification",
];

export const OUT_OF_SCOPE_TRIAGE_TERMS = [
  "dos",
  "denial of service",
  "cookie replay",
  "user enumeration",
  "tenant enumeration",
  "missing http security headers",
  "missing security headers",
  "missing cookie security flags",
  "missing cookie flags",
  "subdomain takeover",
  "dependency confusion",
  "email spoofing",
  "chatbox testing",
  "chatbox",
  "cloudflare",
  "source code disclosure",
  "open redirect",
  "self-xss",
  "self xss",
  "clickjacking",
  "anti-automation",
  "missing captcha",
  "missing rate limiting",
  "rate limiting",
  "rate limit",
  "third-party vulnerable components",
  "third party vulnerable components",
  "documentation-only",
  "user-configuration-based",
];

export const SAFE_NAVIGATION_TEXT = [
  "account",
  "profile",
  "settings",
  "preferences",
  "address",
  "address book",
  "wishlist",
  "favorites",
  "favourites",
  "cart",
  "basket",
  "notifications",
  "documents",
  "messages",
  "support",
  "contact",
];

const SECRET_KEY_RE =
  /(cookie|token|jwt|auth|authorization|session|password|secret|csrf|card|payment|bank|ssn|tax|passport|license|refresh|bearer|private|credential)/i;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const HEX_ID_RE = /\b[0-9a-f]{24,64}\b/gi;
const REDIRECT_KEYS = new Set(["redirect", "redirect_uri", "returnUrl", "next", "continue", "callback", "url"]);

export function isDangerousText(text: string): boolean {
  const normalized = text.toLowerCase();
  return DANGEROUS_TEXT.some((dangerous) => normalized.includes(dangerous));
}

export function isBlockedAction(text: string): boolean {
  return isDangerousText(text);
}

export function triageRuleText(text: string): {
  blocked: boolean;
  reportable: boolean;
  status: "blocked/out-of-scope" | "non-reportable hygiene" | "candidate only";
  reason: string;
} {
  const normalized = text.toLowerCase();
  if (OUT_OF_SCOPE_TRIAGE_TERMS.some((term) => normalized.includes(term))) {
    const hygiene = /missing .*header|missing .*cookie|security header|cookie flag/.test(normalized);
    return {
      blocked: !hygiene,
      reportable: false,
      status: hygiene ? "non-reportable hygiene" : "blocked/out-of-scope",
      reason: hygiene
        ? "Header/cookie hygiene is non-reportable by default unless direct impact exists."
        : "This action or class is blocked/out-of-scope for safe mapping.",
    };
  }

  return {
    blocked: false,
    reportable: false,
    status: "candidate only",
    reason: "Candidate only until real reproducible impact is proven.",
  };
}

export function isSafeNavigationText(text: string): boolean {
  const normalized = text.toLowerCase();
  return SAFE_NAVIGATION_TEXT.some((safe) => normalized.includes(safe));
}

export function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

export function isAllowedUrl(rawUrl: string, config: ProjectConfig): boolean {
  if (isStrictPasteLinkProgram(config)) {
    return validatePasteTargetUrl(rawUrl, config, {
      authenticatedFlowFromInScope: false,
      authenticatedFlowNote: "",
    }).allowed;
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(url.protocol)) return false;

  const host = normalizeHost(url.hostname);
  const allowed = config.allowedDomains.some((domain) => {
    const normalized = normalizeHost(domain);
    if (config.strictScopeHosts) return host === normalized;
    return host === normalized || host.endsWith(`.${normalized}`);
  });
  if (!allowed) return false;

  if (!config.allowAdminPaths && /\/(admin|staff|internal|backoffice)(\/|$)/i.test(url.pathname)) {
    return false;
  }

  return !config.disallowedPaths.some((pattern) => url.pathname.toLowerCase().includes(pattern.toLowerCase()));
}

export interface PasteTargetOptions {
  authenticatedFlowFromInScope?: boolean;
  authenticatedFlowNote?: string;
}

export interface PasteTargetValidation {
  allowed: boolean;
  reason: string;
  requiresFlowEvidence: boolean;
}

export type PasteLinkTriageGrade =
  | "Report candidate P3/P2"
  | "Needs second owned account"
  | "Mapping only"
  | "Out of scope"
  | "Blocked by program rules";

export interface PasteLinkTriageResult {
  grade: PasteLinkTriageGrade;
  reason: string;
  nextStep: string;
}

const PASTE_LINK_FLOW_NOTE_MIN_LENGTH = 12;
const PASTE_LINK_OWNERSHIP_KEYS =
  /^(account_id|accountId|customer_id|customerId|project_id|projectId|site_id|siteId|website_id|websiteId|builder_id|builderId|ticket_id|ticketId|media_id|mediaId|file_id|fileId|order_id|orderId|invoice_id|invoiceId|uuid|guid|id)$/i;
const PASTE_LINK_DO_NOT_SUBMIT_RE =
  /missing .*header|cookie flag|clickjacking|open redirect|self-?xss|rate limit|user enumeration|anti-automation|captcha|cloudflare|source code disclosure|third-party vulnerable|third party vulnerable|subdomain takeover/i;

export function isStrictPasteLinkProgram(config: ProjectConfig): boolean {
  return Boolean(config.strictScopeHosts || config.triageMode?.toLowerCase().includes("lowest realistic payout"));
}

export function validatePasteTargetUrl(
  rawUrl: string,
  config: ProjectConfig,
  options: PasteTargetOptions = {},
): PasteTargetValidation {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      allowed: false,
      reason: "Target URL is not valid.",
      requiresFlowEvidence: false,
    };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return {
      allowed: false,
      reason: "Target URL must use http or https.",
      requiresFlowEvidence: false,
    };
  }

  if (!isStrictPasteLinkProgram(config)) {
    return {
      allowed: isAllowedGenericHost(url, config),
      reason: "Generic scope guard result.",
      requiresFlowEvidence: false,
    };
  }

  const exactTarget = (config.inScopeTargets ?? []).some((target) => {
    const targetUrl = new URL(target);
    return url.protocol === targetUrl.protocol && url.hostname.toLowerCase() === targetUrl.hostname.toLowerCase();
  });

  if (exactTarget && !isDangerousText(url.pathname)) {
    return {
      allowed: true,
      reason: "URL matches an explicitly listed target root in the selected program profile.",
      requiresFlowEvidence: false,
    };
  }

  const relatedSubdomain = (config.inScopeTargets ?? []).some((target) => {
    const targetUrl = new URL(target);
    const targetHost = targetUrl.hostname.toLowerCase();
    const baseHost = targetHost.startsWith("www.") ? targetHost.slice(4) : targetHost;
    const host = url.hostname.toLowerCase();
    return host !== targetHost && host.endsWith(`.${baseHost}`);
  });

  if (
    relatedSubdomain &&
    options.authenticatedFlowFromInScope &&
    (options.authenticatedFlowNote?.trim().length ?? 0) >= PASTE_LINK_FLOW_NOTE_MIN_LENGTH
  ) {
    return {
      allowed: true,
      reason: "URL is allowed only as a documented authenticated navigation flow from an in-scope target.",
      requiresFlowEvidence: true,
    };
  }

  return {
    allowed: false,
    reason:
      "This profile only allows listed target roots by default. Subdomains require clear authenticated-flow evidence.",
    requiresFlowEvidence: false,
  };
}

function isAllowedGenericHost(url: URL, config: ProjectConfig): boolean {
  const host = normalizeHost(url.hostname);
  return config.allowedDomains.some((domain) => {
    const normalized = normalizeHost(domain);
    if (config.strictScopeHosts) return host === normalized;
    return host === normalized || host.endsWith(`.${normalized}`);
  });
}

export function buildTestingHeaders(
  config: ProjectConfig,
  options: { researcherHandle?: string } = {},
): Record<string, string> {
  const headers: Record<string, string> = { ...(config.requiredHeaders ?? {}) };
  const optionalHeaderNames = Object.keys(config.optionalHeaders ?? {});
  if (optionalHeaderNames.length > 0 && options.researcherHandle?.trim()) {
    headers[optionalHeaderNames[0] ?? "X-Researcher-Handle"] = options.researcherHandle.trim();
  }
  return headers;
}

export function isPasteLinkBlockedFinding(text: string): boolean {
  const triage = triageRuleText(text);
  return triage.status === "blocked/out-of-scope" || triage.status === "non-reportable hygiene";
}

export function triagePasteLinkText(text: string): PasteLinkTriageResult {
  if (PASTE_LINK_DO_NOT_SUBMIT_RE.test(text)) {
    return {
      grade: "Out of scope",
      reason: "The selected example rules exclude this finding class by default.",
      nextStep: "Do not submit this class. Return to account ownership, access-control, or sensitive-data mapping.",
    };
  }

  if (isDangerousText(text)) {
    return {
      grade: "Blocked by program rules",
      reason: "This action is blocked for safe paste-link mapping.",
      nextStep: "Stop this line of testing and return to account ownership or access-control mapping.",
    };
  }

  const triage = triageRuleText(text);
  if (triage.status === "non-reportable hygiene") {
    return {
      grade: "Out of scope",
      reason: triage.reason,
      nextStep: "Do not submit this class unless direct security impact is proven by a different qualifying bug.",
    };
  }
  if (triage.status === "blocked/out-of-scope") {
    return {
      grade: "Blocked by program rules",
      reason: triage.reason,
      nextStep: "Stop this line of testing and return to account ownership or access-control mapping.",
    };
  }
  return {
    grade: "Mapping only",
    reason: "No payout candidate is proven by this text alone.",
    nextStep: "Continue safe mapping and look for owned-account object identifiers.",
  };
}

export function triagePasteLinkRequest(request: CapturedRequest): PasteLinkTriageResult {
  const text = `${request.path} ${Object.keys(request.queryParameters).join(" ")} ${Object.keys(request.bodyParameters).join(" ")}`;
  const blockedText = triagePasteLinkText(text);
  if (blockedText.grade === "Blocked by program rules" || blockedText.grade === "Out of scope") return blockedText;

  const ownershipIds = request.visibleIds.filter((id) => PASTE_LINK_OWNERSHIP_KEYS.test(id.key));
  if (ownershipIds.length > 0) {
    return {
      grade: "Needs second owned account",
      reason: "Ownership-style IDs were observed. Reportability needs one safe owned-account comparison proof.",
      nextStep: "Create or use a second owned test account only if allowed, then perform one safe comparison request.",
    };
  }

  if (
    request.featureGuess === "account/profile" ||
    request.featureGuess === "support/contact" ||
    request.featureGuess === "documents"
  ) {
    return {
      grade: "Mapping only",
      reason: "A potentially useful feature was mapped, but no ownership bypass or sensitive data exposure is proven.",
      nextStep: "Map equivalent owned-account flows and look for object IDs or account-specific response data.",
    };
  }

  return {
    grade: "Mapping only",
    reason: "No reportable evidence yet.",
    nextStep: "Prioritize account manager, storefront, site builder, media/file library, or support-ticket flows.",
  };
}

export function safeUrlValue(value: string, allowedDomains: string[]): boolean {
  if (value.length > 160) return false;
  try {
    const url = new URL(value);
    return allowedDomains.some((domain) => {
      const host = normalizeHost(url.hostname);
      const allowed = normalizeHost(domain);
      return host === allowed || host.endsWith(`.${allowed}`);
    });
  } catch {
    return false;
  }
}

export function redactValue(key: string, value: unknown, allowedDomains: string[] = []): string {
  const stringValue = String(value ?? "");
  if (SECRET_KEY_RE.test(key) || SECRET_KEY_RE.test(stringValue)) return REDACTED;
  if (stringValue.length > 160 && !safeUrlValue(stringValue, allowedDomains)) return REDACTED;
  return stringValue;
}

export function redactParams(
  params: Iterable<[string, string]>,
  allowedDomains: string[] = [],
): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of params) {
    output[key] = redactValue(key, value, allowedDomains);
  }
  return output;
}

export function safeBodyParams(
  body: string | null,
  contentType = "",
  allowedDomains: string[] = [],
): Record<string, string> {
  if (!body) return {};
  if (body.length > 20_000) return { _omitted: "body too large to safely log" };
  if (SECRET_KEY_RE.test(body)) return { _omitted: "body contains sensitive-looking data" };

  try {
    if (contentType.includes("json") || body.trim().startsWith("{")) {
      return flattenJson(JSON.parse(body), "", {}, allowedDomains);
    }
  } catch {
    return { _omitted: "json body could not be safely parsed" };
  }

  if (body.includes("=")) {
    return redactParams(new URLSearchParams(body).entries(), allowedDomains);
  }

  return { _omitted: "unstructured body not logged" };
}

function flattenJson(
  value: unknown,
  prefix: string,
  output: Record<string, string>,
  allowedDomains: string[],
): Record<string, string> {
  if (value === null || value === undefined) return output;

  if (Array.isArray(value)) {
    value.slice(0, 25).forEach((item, index) => flattenJson(item, `${prefix}[${index}]`, output, allowedDomains));
    return output;
  }

  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      flattenJson(child, prefix ? `${prefix}.${key}` : key, output, allowedDomains);
    }
    return output;
  }

  output[prefix || "value"] = redactValue(prefix || "value", value, allowedDomains);
  return output;
}

export function classifyFeature(path: string, params: Record<string, string> = {}): FeatureClass {
  const text = `${path} ${Object.keys(params).join(" ")}`.toLowerCase();
  if (/login|logout|signin|signup|register|auth/.test(text)) return "auth";
  if (/address/.test(text)) return "address";
  if (/cart|basket|lineitem|addproduct/.test(text)) return "cart/basket";
  if (/wishlist|favorite|favourite/.test(text)) return "wishlist/favorite";
  if (/order/.test(text)) return "order history";
  if (/document|statement|invoice/.test(text)) return "documents";
  if (/notification/.test(text)) return "notifications";
  if (/support|contact|help|ticket|message/.test(text)) return "support/contact";
  if (/builder|storefront|website|media|library|file|project/.test(text)) return "account/profile";
  if (/search|query/.test(text)) return "search";
  if (/product|sku|pid|category|content/.test(text)) return "product/content";
  if (/admin|staff|internal|backoffice/.test(text)) return "admin-looking";
  if (/account|profile|customer|user|preference|setting/.test(text)) return "account/profile";
  return "unknown";
}

export function identifierKind(key: string, value: string, feature: FeatureClass): IdentifierKind {
  const normalized = key.toLowerCase();
  if (/pid|sku|product/.test(normalized)) return "product/content ID";
  if (/lineitem|productlineitem|basket|cart|uuid/.test(normalized) && feature === "cart/basket") {
    return "session/cart line item ID";
  }
  if (/customer|account|user|profile|address|project|site|website|builder|media|file/.test(normalized)) {
    return "possible ownership ID";
  }
  if (/order|invoice|document|message|notification|ticket/.test(normalized)) return "possible sensitive object ID";
  if (/^id$|_id$|uuid|guid/.test(normalized)) return "unknown";
  if (UUID_RE.test(value) || HEX_ID_RE.test(value)) return "unknown";
  return "unknown";
}

export function detectIdentifiers(
  path: string,
  query: Record<string, string>,
  body: Record<string, string>,
  feature: FeatureClass,
): DetectedIdentifier[] {
  const found: DetectedIdentifier[] = [];

  for (const [source, params] of [
    ["query", query] as const,
    ["body", body] as const,
  ]) {
    for (const [key, value] of Object.entries(params)) {
      if (isIdentifierKey(key) || UUID_RE.test(value) || HEX_ID_RE.test(value)) {
        found.push({ key, value, kind: identifierKind(key, value, feature), source });
      }
    }
  }

  for (const value of path.match(UUID_RE) ?? []) {
    found.push({ key: "uuid", value, kind: identifierKind("uuid", value, feature), source: "path" });
  }
  for (const value of path.match(HEX_ID_RE) ?? []) {
    found.push({ key: "hex-id", value, kind: identifierKind("id", value, feature), source: "path" });
  }

  return dedupeIds(found);
}

function isIdentifierKey(key: string): boolean {
  return /^(user_id|userId|uid|customer_id|customerId|account_id|accountId|profile_id|profileId|address_id|addressId|cart_id|cartId|basket_id|basketId|project_id|projectId|site_id|siteId|website_id|websiteId|builder_id|builderId|ticket_id|ticketId|media_id|mediaId|file_id|fileId|order_id|orderId|invoice_id|invoiceId|document_id|documentId|message_id|messageId|notification_id|lineItemId|productLineItemId|uuid|guid|id|pid|sku)$/i.test(
    key,
  );
}

function dedupeIds(ids: DetectedIdentifier[]): DetectedIdentifier[] {
  const seen = new Set<string>();
  return ids.filter((id) => {
    const key = `${id.source}:${id.key}:${id.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function analyzeHeaders(headers: Record<string, string | string[] | undefined>): SecurityNote[] {
  const notes: SecurityNote[] = [];
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value.join(",") : value ?? ""]),
  );

  for (const header of ["content-security-policy", "strict-transport-security", "x-content-type-options"]) {
    if (!normalized[header]) {
      notes.push({
        type: "security-header",
        label: `${header} missing`,
        detail: "Header hygiene note only; not reportable by itself.",
        reportable: false,
      });
    }
  }

  if (normalized["access-control-allow-origin"] && normalized["access-control-allow-credentials"] === "true") {
    notes.push({
      type: "cors",
      label: "CORS credentials header observed",
      detail: "Candidate only. Real impact requires readable authenticated sensitive data from an owned account.",
      reportable: false,
    });
  }

  const setCookie = normalized["set-cookie"];
  if (setCookie && (!/;\s*secure/i.test(setCookie) || !/;\s*httponly/i.test(setCookie) || !/;\s*samesite=/i.test(setCookie))) {
    notes.push({
      type: "cookie-attribute",
      label: "Cookie attribute hygiene note",
      detail: "Missing cookie flags are non-reportable by default unless direct impact exists.",
      reportable: false,
    });
  }

  return notes;
}

export function classifyCandidates(request: CapturedRequest): CandidateFinding[] {
  const candidates: CandidateFinding[] = [];
  const ownershipIds = request.visibleIds.filter((id) =>
    ["possible ownership ID", "possible sensitive object ID", "session/cart line item ID"].includes(id.kind),
  );

  if (ownershipIds.length > 0) {
    candidates.push({
      id: `${request.projectId}:${request.timestamp}:idor`,
      projectId: request.projectId,
      type: request.featureGuess === "admin-looking" ? "Broken access control candidate" : "IDOR candidate",
      status: "needs proof",
      title: `${request.featureGuess} request contains object identifiers`,
      feature: request.featureGuess,
      evidenceRequestIds: [request.timestamp],
      reason: "Object identifiers were observed in a request. This is candidate-only until tested safely with owned accounts.",
      proofPlan: proofPlanFor("idor"),
      severityHint: "medium",
    });
  }

  if (Object.keys(request.queryParameters).some((key) => REDIRECT_KEYS.has(key))) {
    candidates.push({
      id: `${request.projectId}:${request.timestamp}:redirect`,
      projectId: request.projectId,
      type: "Open redirect candidate",
      status: "mapping only",
      title: "Redirect-like parameter observed",
      feature: request.featureGuess,
      evidenceRequestIds: [request.timestamp],
      reason: "A redirect-like parameter appeared naturally. Real impact is required before reporting.",
      proofPlan: proofPlanFor("redirect"),
      severityHint: "low",
    });
  }

  if (request.securityNotes?.some((note) => note.type === "cors")) {
    candidates.push({
      id: `${request.projectId}:${request.timestamp}:cors`,
      projectId: request.projectId,
      type: "CORS candidate",
      status: "mapping only",
      title: "CORS credential headers observed",
      feature: request.featureGuess,
      evidenceRequestIds: [request.timestamp],
      reason: "CORS is reportable only if authenticated sensitive data is readable cross-origin.",
      proofPlan: proofPlanFor("cors"),
      severityHint: "low",
    });
  }

  if (candidates.length === 0) {
    candidates.push({
      id: `${request.projectId}:${request.timestamp}:info`,
      projectId: request.projectId,
      type: "Not reportable / informational",
      status: "mapping only",
      title: "Request mapped",
      feature: request.featureGuess,
      evidenceRequestIds: [request.timestamp],
      reason: "No reportable evidence. Continue mapping safely.",
      proofPlan: [],
      severityHint: "info",
    });
  }

  return candidates;
}

export function proofPlanFor(kind: "idor" | "xss" | "redirect" | "cors"): string[] {
  if (kind === "idor") {
    return [
      "Need Account A and Account B owned by the researcher.",
      "Capture the same feature request from both accounts.",
      "Perform one safe comparison request only.",
      "Expected secure result: 403, 404, access denied, or empty response.",
      "Potential bug only if Account A can read, modify, delete, or trigger Account B's resource.",
      "Do not touch other users.",
    ];
  }
  if (kind === "xss") {
    return [
      "Start with harmless marker BBTEST-SCOPEGUARD-001.",
      "Only test fields the researcher controls.",
      "Do not steal cookies, exfiltrate data, or target staff.",
      "Do not use payloads unless marker reflection is confirmed and authorized.",
    ];
  }
  if (kind === "redirect") {
    return [
      "Only use naturally discovered redirect parameters.",
      "Use a harmless example domain once.",
      "Report only if real security impact exists.",
    ];
  }
  return [
    "Only review CORS on normal owned-account responses.",
    "Report only if authenticated sensitive data is readable cross-origin.",
    "Do not use aggressive PoCs.",
  ];
}
