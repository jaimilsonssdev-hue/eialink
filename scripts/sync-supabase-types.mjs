import { execFileSync } from "node:child_process";

const projectId = process.env.SUPABASE_PROJECT_ID;
if (!projectId) {
  throw new Error("SUPABASE_PROJECT_ID is required to generate types safely.");
}

// Authentication is intentionally supplied through CI/local environment only.
// Never commit database credentials or an access token to this repository.
const output = execFileSync(
  "pnpm",
  ["exec", "supabase", "gen", "types", "typescript", "--project-id", projectId, "--schema", "public"],
  { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" },
);
process.stdout.write(output);
