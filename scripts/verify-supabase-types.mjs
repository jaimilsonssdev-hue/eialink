import { readFileSync } from "node:fs";

const types = readFileSync(new URL("../src/integrations/supabase/types.ts", import.meta.url), "utf8");
const requiredContracts = [
  "whatsapp_message",
  "plans:",
  "subscriptions:",
  "professional_services:",
];

const missing = requiredContracts.filter((contract) => !types.includes(contract));
if (missing.length) {
  throw new Error(`Supabase types are out of sync. Missing: ${missing.join(", ")}. Run: pnpm run types:sync`);
}

console.log("Supabase type contracts verified.");
