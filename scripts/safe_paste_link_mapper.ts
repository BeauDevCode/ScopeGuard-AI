import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Request } from "playwright";
import { normalizeProjectConfig, type CapturedRequest, type RawProjectConfig } from "@scopeguard/core";
import {
  analyzeHeaders,
  buildTestingHeaders,
  classifyFeature,
  detectIdentifiers,
  isDangerousText,
  redactParams,
  safeBodyParams,
  triagePasteLinkRequest,
  validatePasteTargetUrl,
} from "@scopeguard/rules";

type PendingCapture = Omit<CapturedRequest, "statusCode" | "responseBehavior" | "securityNotes">;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));
const profilePath = path.resolve(repoRoot, args.profile ?? path.join("examples", "demo-shop.example.json"));
const rawConfig = JSON.parse(fs.readFileSync(profilePath, "utf8")) as RawProjectConfig;
const project = normalizeProjectConfig(rawConfig);
const target = args.target ?? project.startUrl;
const validation = validatePasteTargetUrl(target, project, {
  authenticatedFlowFromInScope: Boolean(args["flow-note"]),
  authenticatedFlowNote: args["flow-note"],
});

if (!validation.allowed) {
  console.error(`Refusing to open target: ${validation.reason}`);
  process.exit(1);
}

const projectId = slug(project.name || "demo-project");
const outputDir = path.join(repoRoot, "captures", projectId);
const browserProfileDir = path.join(repoRoot, "generic-browser-profile", projectId);
const pending = new Map<Request, PendingCapture>();

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(browserProfileDir, { recursive: true });

const headers = buildTestingHeaders(project, { researcherHandle: args.handle });
const context = await chromium.launchPersistentContext(browserProfileDir, {
  headless: false,
  extraHTTPHeaders: headers,
});
const page = context.pages()[0] ?? (await context.newPage());
const jsonlPath = path.join(outputDir, "capture.jsonl");
const mdPath = path.join(outputDir, "capture.md");

await context.route("**/*", async (route) => {
  const request = route.request();
  if (shouldBlockUrl(request.url())) {
    console.log(`Blocked dangerous flow: ${safePath(request.url())}`);
    await route.abort("blockedbyclient");
    return;
  }
  await route.continue();
});

page.on("request", (request) => {
  void captureRequest(request);
});

page.on("response", (response) => {
  const base = pending.get(response.request());
  if (!base) return;

  const record: CapturedRequest = {
    ...base,
    statusCode: response.status(),
    responseBehavior: summarizeResponse(base, response.status()),
    securityNotes: analyzeHeaders(response.headers()),
  };
  pending.delete(response.request());
  appendCapture(record);
  console.log(`${record.method} ${record.path} -> ${record.statusCode} [${triagePasteLinkRequest(record).grade}]`);
});

console.log("Opening safe paste-link mapper.");
console.log(`Profile: ${project.name}`);
console.log(`Target: ${target}`);
console.log(`Headers applied: ${Object.keys(headers).join(", ") || "none"}`);
console.log("Log in manually if needed. Do not share passwords or tokens. Do not click payment, purchase, or destructive flows.");
console.log("Press Enter in this terminal to stop capture.");

await page.goto(target, { waitUntil: "domcontentloaded" });
await waitForEnter();
await context.close();

async function captureRequest(request: Request): Promise<void> {
  const url = new URL(request.url());
  if (!isInterestingRequest(url)) return;

  const contentType = (await request.headerValue("content-type").catch(() => null)) ?? "";
  const queryParameters = redactParams(url.searchParams.entries(), project.allowedDomains);
  const bodyParameters = safeBodyParams(request.postData(), contentType, project.allowedDomains);
  const featureGuess = classifyFeature(url.pathname, { ...queryParameters, ...bodyParameters });
  const visibleIds = detectIdentifiers(url.pathname, queryParameters, bodyParameters, featureGuess);

  pending.set(request, {
    timestamp: new Date().toISOString(),
    projectId,
    targetHost: url.hostname,
    featureGuess,
    method: request.method(),
    path: url.pathname,
    queryParameters,
    bodyParameters,
    resourceType: request.resourceType(),
    visibleIds,
    secretsRedacted: "yes",
  });
}

function appendCapture(record: CapturedRequest): void {
  fs.appendFileSync(jsonlPath, `${JSON.stringify(record)}\n`);
  fs.appendFileSync(
    mdPath,
    [
      `## ${record.timestamp}`,
      "",
      `- Feature: ${record.featureGuess}`,
      `- Method: ${record.method}`,
      `- Path: ${record.path}`,
      `- Query: ${JSON.stringify(record.queryParameters)}`,
      `- Body: ${JSON.stringify(record.bodyParameters)}`,
      `- Status: ${record.statusCode}`,
      `- Visible IDs: ${record.visibleIds.map((id) => `${id.key}=${id.value} (${id.kind})`).join(", ") || "none"}`,
      `- Triage: ${triagePasteLinkRequest(record).grade}`,
      `- Secrets redacted: ${record.secretsRedacted}`,
      "",
    ].join("\n"),
  );
}

function isInterestingRequest(url: URL): boolean {
  if (
    !validatePasteTargetUrl(url.toString(), project, {
      authenticatedFlowFromInScope: true,
      authenticatedFlowNote: "observed authenticated flow from configured root",
    }).allowed
  ) {
    return false;
  }

  return /account|profile|support|ticket|builder|storefront|website|site|media|library|file|customer|project|address|preference/i.test(
    `${url.pathname} ${url.search}`,
  );
}

function shouldBlockUrl(rawUrl: string): boolean {
  const text = safePath(rawUrl).toLowerCase();
  return (
    isDangerousText(text) ||
    /checkout|payment|place-order|purchase|refund|coupon|gift-card|delete-account/i.test(text)
  );
}

function safePath(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    return `${url.hostname}${url.pathname}${url.search}`;
  } catch {
    return "[invalid-url]";
  }
}

function summarizeResponse(record: PendingCapture, statusCode: number): string {
  const ids = record.visibleIds.length ? `${record.visibleIds.length} visible ID(s) observed` : "no visible ownership IDs observed";
  return `${record.featureGuess} request returned HTTP ${statusCode}; ${ids}.`;
}

function parseArgs(argv: string[]): Record<string, string | undefined> {
  const parsed: Record<string, string | undefined> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg?.startsWith("--")) continue;
    parsed[arg.slice(2)] = argv[index + 1]?.startsWith("--") ? "true" : argv[index + 1];
  }
  return parsed;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once("data", () => resolve());
  });
}
