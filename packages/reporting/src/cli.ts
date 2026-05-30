import fs from "node:fs";
import { reportToMarkdown } from "./index.js";

const projectArg = process.argv.includes("--project")
  ? process.argv[process.argv.indexOf("--project") + 1]
  : undefined;

if (!projectArg) {
  console.log("Usage: npm run report -- --project <id-or-config>");
  process.exit(0);
}

const out = `# ScopeGuard AI Report Placeholder

No report was generated because report drafts require confirmed reproducible evidence.

Project: ${projectArg}

Use the web app to mark evidence as confirmed before generating a final report.
`;

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/report-placeholder.md", out);
console.log(reportToMarkdown);
console.log("Wrote reports/report-placeholder.md");
