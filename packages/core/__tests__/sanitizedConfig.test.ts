import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CANDIDATE_STATUS_EXPLANATIONS,
  normalizeProjectConfig,
  validateProjectConfig,
  validateResearchMarker,
  type CandidateStatus,
  type RawProjectConfig,
} from "../src/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const examplePath = path.resolve(__dirname, "../../../examples/demo-shop.example.json");
const sanitizedDir = path.resolve(__dirname, "../../../examples/sanitized");

function loadExample(): RawProjectConfig {
  return JSON.parse(fs.readFileSync(examplePath, "utf8")) as RawProjectConfig;
}

function readJson<T>(fileName: string): T {
  return JSON.parse(fs.readFileSync(path.join(sanitizedDir, fileName), "utf8")) as T;
}

describe("sanitized demo project config", () => {
  it("parses public-safe profile metadata", () => {
    const project = normalizeProjectConfig(loadExample());

    expect(project.name).toBe("Example Program Beta");
    expect(project.programName).toBe("Example Program Beta");
    expect(project.platform).toBe("Example bounty platform");
    expect(project.allowedDomains).toEqual(["demo-shop.example", "demo-saas.example"]);
    expect(project.requiredHeaders).toEqual({ "X-Demo-Research": "Portfolio" });
  });

  it("accepts a generic research marker", () => {
    expect(validateResearchMarker("DEMO")).toEqual({ ok: true, errors: [] });
  });

  it("requires explicit authorization before running", () => {
    const project = normalizeProjectConfig(loadExample());
    const validation = validateProjectConfig(project);

    expect(validation.ok).toBe(false);
    expect(validation.errors).toContain("Authorization confirmation is required.");
  });

  it("defines portfolio status explanations for every candidate state", () => {
    const statuses: CandidateStatus[] = [
      "mapping only",
      "needs owned-account proof",
      "candidate finding",
      "out of scope",
      "report ready",
    ];

    for (const status of statuses) {
      expect(CANDIDATE_STATUS_EXPLANATIONS[status]).toBeTruthy();
    }
  });

  it("loads richer sanitized examples using only fake demo hosts and IDs", () => {
    const allowedHosts = new Set(["demo-shop.example", "demo-saas.example", "owned-lab.local"]);
    const allowedIds = new Set(["demo_project_123", "demo_user_456", "demo_ticket_789", "demo_file_111"]);
    const profiles = readJson<Array<{ startUrl: string; allowedDomains: string[] }>>("demo-program-profiles.json");
    const requestMap = readJson<
      Array<{
        targetHost: string;
        visibleIds: Array<{ value: string }>;
      }>
    >("demo-request-map.json");
    const candidates = readJson<Array<{ status: CandidateStatus }>>("demo-candidates.json");
    const reportWorkflow = readJson<{ asset: string; status: CandidateStatus }>("demo-report-workflow.json");

    for (const profile of profiles) {
      expect(allowedHosts.has(new URL(profile.startUrl).hostname)).toBe(true);
      expect(profile.allowedDomains.every((domain) => allowedHosts.has(domain))).toBe(true);
    }

    for (const request of requestMap) {
      expect(allowedHosts.has(request.targetHost)).toBe(true);
      expect(request.visibleIds.every((id) => allowedIds.has(id.value))).toBe(true);
    }

    expect(candidates.map((candidate) => candidate.status)).toEqual([
      "mapping only",
      "needs owned-account proof",
      "candidate finding",
      "out of scope",
      "report ready",
    ]);
    expect(new URL(reportWorkflow.asset).hostname).toBe("owned-lab.local");
    expect(reportWorkflow.status).toBe("report ready");
  });
});
