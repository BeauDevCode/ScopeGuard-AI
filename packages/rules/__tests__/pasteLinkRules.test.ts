import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { CapturedRequest, RawProjectConfig } from "@scopeguard/core";
import { normalizeProjectConfig } from "@scopeguard/core";
import {
  buildTestingHeaders,
  classifyFeature,
  detectIdentifiers,
  isAllowedUrl,
  isBlockedAction,
  triagePasteLinkRequest,
  triagePasteLinkText,
  validatePasteTargetUrl,
} from "../src/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const examplePath = path.resolve(__dirname, "../../../examples/demo-shop.example.json");
const templatePath = path.resolve(__dirname, "../../../docs/report-templates/GENERIC_BOUNTY_REPORT.md");

function project() {
  return normalizeProjectConfig(
    JSON.parse(fs.readFileSync(examplePath, "utf8")) as RawProjectConfig,
  );
}

describe("public-safe paste-link workflow rules", () => {
  it("allows only listed demo target roots by default", () => {
    const config = project();

    expect(isAllowedUrl("https://demo-shop.example/account", config)).toBe(true);
    expect(isAllowedUrl("https://demo-saas.example/account", config)).toBe(true);
    expect(isAllowedUrl("https://app.demo-shop.example/account", config)).toBe(false);
    expect(isAllowedUrl("https://outside.example/account", config)).toBe(false);
  });

  it("allows a related subdomain only with authenticated-flow evidence", () => {
    const config = project();

    expect(
      validatePasteTargetUrl("https://app.demo-shop.example/account", config, {
        authenticatedFlowFromInScope: true,
        authenticatedFlowNote: "Clicked account after login from https://demo-shop.example.",
      }),
    ).toMatchObject({ allowed: true, requiresFlowEvidence: true });
  });

  it("adds required and optional demo headers", () => {
    const headers = buildTestingHeaders(project(), { researcherHandle: "demo-researcher" });

    expect(headers["X-Demo-Research"]).toBe("Portfolio");
    expect(headers["X-Researcher-Handle"]).toBe("demo-researcher");
  });

  it.each(["missing headers", "cookie flags", "open redirect", "self-XSS", "clickjacking", "rate limiting"])(
    "marks excluded finding class out of scope: %s",
    (findingClass) => {
      expect(triagePasteLinkText(findingClass)).toMatchObject({
        grade: "Out of scope",
      });
    },
  );

  it.each(["DoS", "payment", "domain purchase", "destructive testing"])("blocks dangerous action: %s", (action) => {
    expect(isBlockedAction(action)).toBe(true);
    expect(triagePasteLinkText(action)).toMatchObject({
      grade: "Blocked by program rules",
    });
  });

  it("marks ownership IDs as needing owned-account proof", () => {
    const pathOnly = "/api/projects";
    const queryParameters = { project_id: "demo_project_123" };
    const featureGuess = classifyFeature(pathOnly, queryParameters);
    const visibleIds = detectIdentifiers(pathOnly, queryParameters, {}, featureGuess);
    const request: CapturedRequest = {
      timestamp: "2026-05-30T00:00:00.000Z",
      projectId: "example-program-beta",
      targetHost: "demo-shop.example",
      featureGuess,
      method: "GET",
      path: pathOnly,
      queryParameters,
      bodyParameters: {},
      statusCode: 200,
      resourceType: "xhr",
      responseBehavior: "owned demo project metadata returned",
      visibleIds,
      secretsRedacted: "yes",
    };

    expect(triagePasteLinkRequest(request)).toMatchObject({
      grade: "Needs second owned account",
    });
  });

  it("uses ordered steps in the generic report template", () => {
    const template = fs.readFileSync(templatePath, "utf8");

    expect(template).toContain("Steps To Reproduce:");
    expect(template).toMatch(/\n1\. /);
    expect(template).toMatch(/\n2\. /);
    expect(template).toMatch(/\n3\. /);
  });
});
