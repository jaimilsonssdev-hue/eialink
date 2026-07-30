import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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

const destination = fileURLToPath(
  new URL("../src/integrations/supabase/types.ts", import.meta.url),
);

writeFileSync(destination, output, "utf8");
console.log(`Tipos do Supabase atualizados em ${destination}`);
