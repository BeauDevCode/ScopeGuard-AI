import { useMemo, useState } from "react";
import {
  CANDIDATE_STATUS_EXPLANATIONS,
  normalizeProjectConfig,
  validateProjectConfig,
  type CandidateStatus,
  type RawProjectConfig,
} from "@scopeguard/core";
import { buildTestingHeaders, validatePasteTargetUrl } from "@scopeguard/rules";

const DEFAULT_FORM = {
  projectName: "Example Program Alpha",
  programName: "Example Program Alpha",
  startUrl: "https://demo-saas.example",
  allowedDomains: "demo-saas.example",
  disallowedPaths: "billing\npayment\ndelete-account",
  authorizationNote: "Sanitized demo profile for public portfolio use.",
  userAgentMarker: "ScopeGuard-AI DEMO",
  researchAccountMarker: "DEMO",
  submissionPortal: "Example submission portal",
  outOfScopeVulnerabilityClasses:
    "DoS\ncookie replay\nuser enumeration\ntenant enumeration\nmissing HTTP security headers\nmissing cookie security flags\nsubdomain takeover\ndependency confusion",
  confirmedAuthorization: false,
};

const DEMO_PROFILES: Array<{
  id: string;
  name: string;
  description: string;
  config: RawProjectConfig;
}> = [
  {
    id: "demo-shop",
    name: "Demo Shop",
    description: "Strict fake bounty profile with listed roots only.",
    config: {
      projectName: "Example Program Beta",
      programName: "Example Program Beta",
      platform: "Example bounty platform",
      startUrl: "https://demo-shop.example",
      inScopeTargets: ["https://demo-shop.example", "https://demo-saas.example"],
      allowedDomains: ["demo-shop.example", "demo-saas.example"],
      strictScopeHosts: true,
      requiredHeaders: {
        "X-Demo-Research": "Portfolio",
      },
      optionalHeaders: {
        "X-Researcher-Handle": "[demo-handle]",
      },
      authEmailRule: "Use owned demo accounts only.",
      userAgentMarker: "ScopeGuard-AI DEMO",
      authorizationNote:
        "Only listed demo roots are in scope by default. Subdomains need documented authenticated-flow evidence.",
      safeModes: ["Passive", "Safe authenticated mapping", "Owned-account comparison", "Lab mode only"],
      defaultMode: "Safe authenticated mapping",
      testingMode: "authenticated-manual-session-mapping",
      confirmedAuthorization: false,
      blockedActions: [
        "DoS",
        "checkout",
        "payment",
        "purchase",
        "destructive testing",
        "high-volume traffic",
        "brute force",
        "fuzzing",
        "credential attacks",
      ],
      outOfScopeVulnerabilityClasses: [
        "missing headers",
        "cookie flags",
        "clickjacking",
        "open redirect",
        "self-XSS",
        "DoS",
        "user enumeration",
        "rate limiting",
      ],
    },
  },
  {
    id: "demo-saas",
    name: "Demo SaaS",
    description: "Single-host fake SaaS profile for mapped account flows.",
    config: {
      projectName: "Example Program Alpha",
      programName: "Example Program Alpha",
      platform: "Example bounty platform",
      startUrl: "https://demo-saas.example",
      inScopeTargets: ["https://demo-saas.example"],
      allowedDomains: ["demo-saas.example"],
      disallowedPaths: ["billing", "payment", "delete-account"],
      userAgentMarker: "ScopeGuard-AI DEMO",
      authorizationNote: "Sanitized demo profile for public portfolio use.",
      safeModes: ["Passive", "Safe authenticated mapping"],
      defaultMode: "Safe authenticated mapping",
      testingMode: "safe-ui-mapping",
      confirmedAuthorization: false,
      blockedActions: ["payment", "delete account", "checkout", "credential attacks"],
    },
  },
  {
    id: "owned-lab",
    name: "Owned Lab",
    description: "Local-style owned lab profile using a fake reserved host.",
    config: {
      projectName: "Owned Lab Demo",
      programName: "Owned Lab Demo",
      startUrl: "https://owned-lab.local",
      inScopeTargets: ["https://owned-lab.local"],
      allowedDomains: ["owned-lab.local"],
      disallowedPaths: [],
      userAgentMarker: "ScopeGuard-AI-Lab",
      authorizationNote: "Owned lab data only.",
      safeModes: ["Lab mode only", "Passive"],
      defaultMode: "Lab mode only",
      testingMode: "lab-mode",
      labMode: true,
      confirmedAuthorization: false,
      blockedActions: ["DoS", "brute force", "credential attacks", "destructive testing"],
    },
  },
];
const FALLBACK_PROFILE = DEMO_PROFILES[0]!;

const STATS = [
  { label: "Projects", value: "3", note: "sanitized demo profiles" },
  { label: "Targets", value: "3", note: "fake domains only" },
  { label: "Requests mapped", value: "18", note: "redacted metadata" },
  { label: "Candidate findings", value: "5", note: "strictly triaged" },
  { label: "Reports ready", value: "1", note: "mock confirmed evidence" },
];

const STATUS_ORDER: CandidateStatus[] = [
  "mapping only",
  "needs owned-account proof",
  "candidate finding",
  "out of scope",
  "report ready",
];

const WORKFLOW_STEPS = [
  {
    label: "Scope",
    text: "Load allowed domains, blocked actions, required markers, and authorization notes.",
  },
  {
    label: "Map",
    text: "Capture safe request metadata during normal UI flows; no payloads, secrets, or high-volume scanning.",
  },
  {
    label: "Triage",
    text: "Separate product IDs, ownership IDs, hygiene notes, and out-of-scope classes.",
  },
  {
    label: "Report",
    text: "Draft only from confirmed, redacted, reproducible demo evidence.",
  },
];

const REQUEST_MAP_PREVIEW = [
  {
    method: "GET",
    path: "/api/projects",
    feature: "account/profile",
    ids: "project_id=demo_project_123",
    status: "needs owned-account proof" as CandidateStatus,
  },
  {
    method: "GET",
    path: "/api/catalog",
    feature: "product/content",
    ids: "demo_product_222",
    status: "mapping only" as CandidateStatus,
  },
  {
    method: "POST",
    path: "/api/support/tickets",
    feature: "support/contact",
    ids: "ticket_id=demo_ticket_789",
    status: "candidate finding" as CandidateStatus,
  },
];

const REPORT_CHECKLIST = [
  { label: "In scope?", passed: true },
  { label: "Authorized?", passed: true },
  { label: "Reproducible?", passed: true },
  { label: "Impact clear?", passed: true },
  { label: "Evidence redacted?", passed: true },
  { label: "Screenshots/video ready?", passed: false },
  { label: "Out-of-scope exclusions checked?", passed: true },
];

export function ProjectCreateForm() {
  const [form, setForm] = useState(DEFAULT_FORM);

  const project = useMemo(
    () =>
      normalizeProjectConfig({
        projectName: form.projectName,
        programName: form.programName,
        startUrl: form.startUrl,
        allowedDomains: lines(form.allowedDomains),
        disallowedPaths: lines(form.disallowedPaths),
        authorizationNote: form.authorizationNote,
        userAgentMarker: form.userAgentMarker,
        researchAccountMarker: form.researchAccountMarker,
        submissionPortal: form.submissionPortal,
        outOfScopeVulnerabilityClasses: lines(form.outOfScopeVulnerabilityClasses),
        confirmedAuthorization: form.confirmedAuthorization,
      }),
    [form],
  );
  const validation = validateProjectConfig(project);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Authorized Safe Mapper</p>
          <h1>ScopeGuard AI</h1>
          <p className="hero-text">
            Portfolio-grade scope modeling, redacted request mapping, candidate triage, and responsible report workflow
            support for authorized bug bounty research.
          </p>
          <div className="hero-actions" aria-label="Safety indicators">
            <Indicator label="Redacted metadata only" tone="teal" />
            <Indicator label="No secrets stored" tone="amber" />
            <Indicator label="Authorized testing only" tone="green" />
          </div>
        </div>
        <div className="hero-status" aria-label="Current demo posture">
          <span className="status-pill ok">Public-safe demo</span>
          <strong>No exploit scanner behavior</strong>
          <span>Fake domains, fake IDs, and checklist-gated report drafting.</span>
        </div>
      </header>

      <section className="stats-grid" aria-label="Demo dashboard stats">
        {STATS.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <SafeByDesignPanel />
        <WorkflowPanel />
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Candidate Triage</p>
            <h2>Status badges</h2>
          </div>
          <span className="status-pill neutral">Strict by default</span>
        </div>
        <div className="status-grid">
          {STATUS_ORDER.map((status) => (
            <article className="status-card" key={status}>
              <StatusBadge status={status} />
              <p>{CANDIDATE_STATUS_EXPLANATIONS[status]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <RequestMapPreview />
        <ReportWorkflowPreview />
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Project Setup</p>
            <h2>Authorization-first project</h2>
          </div>
          <span className={validation.ok ? "status-pill ok" : "status-pill warn"}>
            {validation.ok ? "Ready to map" : "Needs checks"}
          </span>
        </div>
        <div className="grid">
          <Field label="Project name" value={form.projectName} onChange={(value) => update("projectName", value)} />
          <Field label="Program name" value={form.programName} onChange={(value) => update("programName", value)} />
          <Field label="Start URL" value={form.startUrl} onChange={(value) => update("startUrl", value)} />
          <Field
            label="Required User-Agent marker"
            value={form.userAgentMarker}
            onChange={(value) => update("userAgentMarker", value)}
          />
          <Field
            label="Research account / tenant marker"
            value={form.researchAccountMarker}
            onChange={(value) => update("researchAccountMarker", value)}
            placeholder="Example: DEMO"
          />
          <Field
            label="Submission portal"
            value={form.submissionPortal}
            onChange={(value) => update("submissionPortal", value)}
            placeholder="Example submission portal"
          />
        </div>

        <label>
          Allowed domains
          <textarea value={form.allowedDomains} onChange={(event) => update("allowedDomains", event.target.value)} />
        </label>

        <label>
          Disallowed paths
          <textarea value={form.disallowedPaths} onChange={(event) => update("disallowedPaths", event.target.value)} />
        </label>

        <label>
          Out-of-scope vulnerability classes
          <textarea
            value={form.outOfScopeVulnerabilityClasses}
            onChange={(event) => update("outOfScopeVulnerabilityClasses", event.target.value)}
          />
        </label>

        <label>
          Authorization note
          <textarea
            value={form.authorizationNote}
            onChange={(event) => update("authorizationNote", event.target.value)}
            placeholder="Describe bug bounty authorization, internal approval, or lab ownership."
          />
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={form.confirmedAuthorization}
            onChange={(event) => update("confirmedAuthorization", event.target.checked)}
          />
          I confirm I am authorized to test this target and will follow the program rules.
        </label>

        {!validation.ok && (
          <div className="notice warn" role="status">
            {validation.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </section>

      <PasteTargetScreen />
    </main>
  );
}

function SafeByDesignPanel() {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Safe By Design</p>
          <h2>Built-in guardrails</h2>
        </div>
        <span className="status-pill ok">Metadata only</span>
      </div>
      <div className="guardrail-list">
        <Indicator label="Scope validation before mapping" tone="green" />
        <Indicator label="Cookies, auth headers, JWTs, and passwords are redacted" tone="amber" />
        <Indicator label="Payment, destructive, brute force, fuzzing, and DoS paths are blocked" tone="red" />
        <Indicator label="Report drafts require confirmed sanitized demo evidence" tone="teal" />
      </div>
    </section>
  );
}

function WorkflowPanel() {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Workflow</p>
          <h2>Scope to report</h2>
        </div>
      </div>
      <div className="workflow">
        {WORKFLOW_STEPS.map((step) => (
          <article className="workflow-step" key={step.label}>
            <strong>{step.label}</strong>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RequestMapPreview() {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Request Map</p>
          <h2>Readable metadata</h2>
        </div>
        <span className="status-pill neutral">Secrets redacted</span>
      </div>
      <div className="request-table" role="table" aria-label="Sanitized request map preview">
        <div className="request-row request-head" role="row">
          <span>Request</span>
          <span>Feature</span>
          <span>Visible IDs</span>
          <span>Status</span>
        </div>
        {REQUEST_MAP_PREVIEW.map((request) => (
          <div className="request-row" role="row" key={`${request.method}-${request.path}`}>
            <span>
              <strong>{request.method}</strong> {request.path}
            </span>
            <span>{request.feature}</span>
            <span>{request.ids}</span>
            <StatusBadge status={request.status} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ReportWorkflowPreview() {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Report Workflow</p>
          <h2>Readiness checklist</h2>
        </div>
        <span className="status-pill warn">Media pending</span>
      </div>
      <div className="checklist">
        {REPORT_CHECKLIST.map((item) => (
          <div className="checkline" key={item.label}>
            <span className={item.passed ? "check-dot pass" : "check-dot pending"} aria-hidden="true" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PasteTargetScreen() {
  const [profileId, setProfileId] = useState(FALLBACK_PROFILE.id);
  const [targetUrl, setTargetUrl] = useState("https://demo-shop.example");
  const [researcherHandle, setResearcherHandle] = useState("");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [confirmedAuthorization, setConfirmedAuthorization] = useState(false);
  const [authenticatedFlowFromInScope, setAuthenticatedFlowFromInScope] = useState(false);
  const [authenticatedFlowNote, setAuthenticatedFlowNote] = useState("");
  const [testingMode, setTestingMode] = useState("Safe authenticated mapping");
  const [demoMessage, setDemoMessage] = useState("");

  const selectedProfile = DEMO_PROFILES.find((profile) => profile.id === profileId) ?? FALLBACK_PROFILE;
  const project = useMemo(() => normalizeProjectConfig(selectedProfile.config), [selectedProfile]);
  const targetValidation = validatePasteTargetUrl(targetUrl, project, {
    authenticatedFlowFromInScope,
    authenticatedFlowNote,
  });
  const headers = buildTestingHeaders(project, { researcherHandle });
  const ready = targetValidation.allowed && confirmedAuthorization;
  const safeModes = project.safeModes?.length ? project.safeModes : ["Passive", "Safe authenticated mapping"];

  function changeProfile(nextProfileId: string) {
    const nextProfile = DEMO_PROFILES.find((profile) => profile.id === nextProfileId) ?? FALLBACK_PROFILE;
    setProfileId(nextProfile.id);
    setTargetUrl(nextProfile.config.startUrl ?? "");
    setTestingMode(nextProfile.config.defaultMode ?? nextProfile.config.safeModes?.[0] ?? "Safe authenticated mapping");
    setDemoMessage("");
  }

  function startDemoMapping() {
    if (!ready) {
      setDemoMessage("Demo start blocked until target scope and authorization are confirmed.");
      return;
    }
    setDemoMessage("Demo mapping staged. This public UI does not launch real target automation.");
  }

  return (
    <section className="panel paste-target">
      <div className="section-head">
        <div>
          <p className="eyebrow">Paste-Link Mode</p>
          <h2>Safe target intake</h2>
        </div>
        <span className={ready ? "status-pill ok" : "status-pill warn"}>{ready ? "Safe demo start" : "Blocked"}</span>
      </div>

      <div className="grid">
        <label>
          Example program profile
          <select value={profileId} onChange={(event) => changeProfile(event.target.value)}>
            {DEMO_PROFILES.map((profile) => (
              <option value={profile.id} key={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          <span className="field-hint">{selectedProfile.description}</span>
        </label>
        <Field label="Target URL" value={targetUrl} onChange={setTargetUrl} />
        <Field
          label="Researcher handle for optional header"
          value={researcherHandle}
          onChange={setResearcherHandle}
          placeholder="Optional demo handle"
        />
        <label>
          Safe mode
          <select value={testingMode} onChange={(event) => setTestingMode(event.target.value)}>
            {safeModes.map((mode) => (
              <option key={mode}>{mode}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="validation-layout">
        <div className={targetValidation.allowed ? "notice ok" : "notice danger"} role="status">
          <strong>{targetValidation.allowed ? "In demo scope" : "Out of scope or needs evidence"}</strong>
          <p>{targetValidation.reason}</p>
          {targetValidation.requiresFlowEvidence && <p>Keep notes proving the in-scope authenticated navigation flow.</p>}
        </div>
        <div className="mini-panel">
          <strong>Allowed domains</strong>
          <TagList items={project.allowedDomains} />
        </div>
        <div className="mini-panel">
          <strong>Blocked actions</strong>
          <TagList items={project.blockedActions ?? ["DoS", "payment", "brute force", "destructive testing"]} />
        </div>
        <div className="mini-panel">
          <strong>Required marker/header</strong>
          <p>User-Agent: {project.userAgentMarker}</p>
          <p>{formatHeaders(headers) || "No extra headers configured."}</p>
        </div>
      </div>

      <label className="check">
        <input
          type="checkbox"
          checked={identityVerified}
          onChange={(event) => setIdentityVerified(event.target.checked)}
        />
        Platform identity is verified or not required for this demo.
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={confirmedAuthorization}
          onChange={(event) => setConfirmedAuthorization(event.target.checked)}
        />
        I confirm this demo target is authorized and in scope.
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={authenticatedFlowFromInScope}
          onChange={(event) => setAuthenticatedFlowFromInScope(event.target.checked)}
        />
        This is a documented authenticated flow from a listed target.
      </label>

      {authenticatedFlowFromInScope && (
        <label>
          Authenticated flow note
          <textarea
            value={authenticatedFlowNote}
            onChange={(event) => setAuthenticatedFlowNote(event.target.value)}
            placeholder="Example: clicked Account after logging in at https://demo-shop.example and landed here."
          />
        </label>
      )}

      <div className="action-row">
        <button type="button" className="primary-button" disabled={!ready} onClick={startDemoMapping}>
          Start safe mapping
        </button>
        <span>{demoMessage || "Public demo mode only; no real automation is launched from this screen."}</span>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function StatusBadge({ status }: { status: CandidateStatus }) {
  return <span className={`candidate-badge ${slug(status)}`}>{sentenceCase(status)}</span>;
}

function Indicator({ label, tone }: { label: string; tone: "green" | "amber" | "teal" | "red" }) {
  return (
    <span className="indicator">
      <span className={`indicator-dot ${tone}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="tag-list">
      {items.map((item) => (
        <span className="tag" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

function formatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}

function lines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function slug(value: string): string {
  return value.replace(/[^a-z0-9]+/g, "-");
}
