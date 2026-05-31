import { describe, expect, it } from "vitest";
import { normalizeProjectConfig, type CandidateFinding } from "@scopeguard/core";
import {
  buildReportReadinessChecklist,
  generateReportDraft,
  isSanitizedDemoProject,
  reportToMarkdown,
} from "../src/index";

const finding: CandidateFinding = {
  id: "owned-lab-demo:report-001",
  projectId: "owned-lab-demo",
  type: "IDOR candidate",
  status: "report ready",
  title: "Owned lab file comparison has confirmed safe demo evidence",
  feature: "documents",
  evidenceRequestIds: ["2026-05-30T00:03:00.000Z"],
  reason: "The fake owned-lab evidence has scope, authorization, impact, redaction, and exclusion checks completed.",
  proofPlan: [],
  severityHint: "medium",
};

function demoProject() {
  return normalizeProjectConfig({
    projectName: "Owned Lab Demo",
    startUrl: "https://owned-lab.local",
    allowedDomains: ["owned-lab.local"],
    disallowedPaths: [],
    authorizationNote: "Owned fake lab data only.",
    userAgentMarker: "ScopeGuard-AI-Lab",
    testingMode: "lab-mode",
    confirmedAuthorization: true,
  });
}

describe("report readiness workflow", () => {
  it("grades readiness with an explicit checklist", () => {
    const checklist = buildReportReadinessChecklist({
      project: demoProject(),
      finding,
      evidenceConfirmed: true,
      impact: "Owned demo account A could read fake owned-lab file metadata from account B.",
      screenshotsReady: false,
      outOfScopeChecked: true,
    });

    expect(checklist.ready).toBe(false);
    expect(checklist.missing).toEqual(["Screenshots/video ready?"]);
  });

  it("generates a sanitized mock report only after checklist gates pass", () => {
    const report = generateReportDraft({
      project: demoProject(),
      finding,
      evidenceConfirmed: true,
      impact: "Owned demo account A could read fake owned-lab file metadata from account B.",
      actualResult: "The fake owned-lab demo returned file metadata instead of access denied.",
      screenshotsReady: true,
      outOfScopeChecked: true,
    });

    expect(report.title).toContain("Mock IDOR candidate report");
    expect(report.asset).toBe("https://owned-lab.local");
    expect(reportToMarkdown(report)).toContain("Safety Statement");
  });

  it("refuses public report drafts for non-demo hosts", () => {
    const project = normalizeProjectConfig({
      projectName: "Outside Example",
      startUrl: "https://outside.example",
      allowedDomains: ["outside.example"],
      disallowedPaths: [],
      authorizationNote: "Not a sanitized demo host.",
      userAgentMarker: "ScopeGuard-AI DEMO",
      confirmedAuthorization: true,
    });

    expect(isSanitizedDemoProject(project)).toBe(false);
    expect(() =>
      generateReportDraft({
        project,
        finding,
        evidenceConfirmed: true,
        impact: "Fake impact.",
        screenshotsReady: true,
        outOfScopeChecked: true,
      }),
    ).toThrow("Public report drafts are limited to sanitized demo projects.");
  });
});
