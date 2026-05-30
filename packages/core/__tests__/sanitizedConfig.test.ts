import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  normalizeProjectConfig,
  validateProjectConfig,
  validateResearchMarker,
  type RawProjectConfig,
} from "../src/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const examplePath = path.resolve(__dirname, "../../../examples/demo-shop.example.json");

function loadExample(): RawProjectConfig {
  return JSON.parse(fs.readFileSync(examplePath, "utf8")) as RawProjectConfig;
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
});
