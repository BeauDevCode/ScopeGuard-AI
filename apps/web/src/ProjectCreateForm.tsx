import { useMemo, useState } from "react";
import { normalizeProjectConfig, validateProjectConfig } from "@scopeguard/core";
import { buildTestingHeaders, validatePasteTargetUrl } from "@scopeguard/rules";

const DEFAULT_FORM = {
  projectName: "Example Program Alpha",
  programName: "Example Program Alpha",
  startUrl: "https://demo-saas.example",
  allowedDomains: "demo-saas.example",
  disallowedPaths: "",
  authorizationNote: "",
  userAgentMarker: "ScopeGuard-AI DEMO",
  researchAccountMarker: "DEMO",
  submissionPortal: "Example submission portal",
  outOfScopeVulnerabilityClasses:
    "DoS\ncookie replay\nuser enumeration\ntenant enumeration\nmissing HTTP security headers\nmissing cookie security flags\nsubdomain takeover\ndependency confusion",
  confirmedAuthorization: false,
};

const DEMO_PROFILE = normalizeProjectConfig({
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
  testingMode: "authenticated-manual-session-mapping",
  confirmedAuthorization: false,
});

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
      <section className="hero">
        <div>
          <p className="eyebrow">Authorized Bug Bounty Recon</p>
          <h1>ScopeGuard AI</h1>
          <p>Safe project setup for scoped, rules-aware web vulnerability mapping.</p>
        </div>
        <span className={validation.ok ? "badge ok" : "badge warn"}>
          {validation.ok ? "Ready to run" : "Needs authorization"}
        </span>
      </section>

      <section className="panel">
        <h2>New Project</h2>
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
            placeholder="Example: MSRC Researcher Portal"
          />
        </div>

        <label>
          Allowed domains
          <textarea value={form.allowedDomains} onChange={(event) => update("allowedDomains", event.target.value)} />
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
          <div className="errors">
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

function PasteTargetScreen() {
  const [targetUrl, setTargetUrl] = useState("https://demo-shop.example");
  const [researcherHandle, setResearcherHandle] = useState("");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [confirmedAuthorization, setConfirmedAuthorization] = useState(false);
  const [confirmedNoPayment, setConfirmedNoPayment] = useState(false);
  const [authenticatedFlowFromInScope, setAuthenticatedFlowFromInScope] = useState(false);
  const [authenticatedFlowNote, setAuthenticatedFlowNote] = useState("");
  const [testingMode, setTestingMode] = useState("Safe authenticated mapping");

  const targetValidation = validatePasteTargetUrl(targetUrl, DEMO_PROFILE, {
    authenticatedFlowFromInScope,
    authenticatedFlowNote,
  });
  const headers = buildTestingHeaders(DEMO_PROFILE, { researcherHandle });
  const ready = targetValidation.allowed && confirmedAuthorization && confirmedNoPayment;

  return (
    <section className="panel paste-target">
      <div className="section-head">
        <div>
          <p className="eyebrow">Paste-Link Mode</p>
          <h2>Paste Target</h2>
        </div>
        <span className={ready ? "badge ok" : "badge warn"}>{ready ? "Safe to map" : "Needs checks"}</span>
      </div>

      <div className="grid">
        <label>
          Bug bounty program profile
          <select value="demo" disabled>
            <option value="demo">Example Program Beta</option>
          </select>
        </label>
        <Field label="Target URL" value={targetUrl} onChange={setTargetUrl} />
        <Field
          label="Researcher handle for optional header"
          value={researcherHandle}
          onChange={setResearcherHandle}
          placeholder="Optional"
        />
        <label>
          Testing mode
          <select value={testingMode} onChange={(event) => setTestingMode(event.target.value)}>
            <option>Passive</option>
            <option>Safe authenticated mapping</option>
            <option>Owned-account comparison</option>
            <option>Lab mode only</option>
          </select>
        </label>
      </div>

      <label className="check">
        <input
          type="checkbox"
          checked={identityVerified}
          onChange={(event) => setIdentityVerified(event.target.checked)}
        />
        Confirm identity verified on the selected platform.
      </label>
      {!identityVerified && (
        <p className="hint">
          You can research, but submissions may be blocked until platform identity verification is complete.
        </p>
      )}

      <label className="check">
        <input
          type="checkbox"
          checked={confirmedAuthorization}
          onChange={(event) => setConfirmedAuthorization(event.target.checked)}
        />
        Confirm authorization / scope.
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={confirmedNoPayment}
          onChange={(event) => setConfirmedNoPayment(event.target.checked)}
        />
        Confirm no payment, purchase, destructive, chatbox, or customer-impact testing.
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={authenticatedFlowFromInScope}
          onChange={(event) => setAuthenticatedFlowFromInScope(event.target.checked)}
        />
        This is a documented authenticated flow from one of the listed targets.
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

      <div className="result">
        <p>{targetValidation.reason}</p>
        {targetValidation.requiresFlowEvidence && <p>Keep screenshot or notes proving the in-scope navigation flow.</p>}
        <p>
          Headers:{" "}
          {Object.entries(headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join("; ")}
        </p>
        <p>Mode: {testingMode}</p>
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

function lines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
