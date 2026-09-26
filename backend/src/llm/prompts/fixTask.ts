import type { Claim, Role } from "../../types.js";
import { studentBlock } from "./shared.js";

export function fixTaskPrompt(role: Role, claim: Claim, missingConcepts: string[]): string {
  return `A student preparing for a ${role.name} interview failed to demonstrate these concepts:
${missingConcepts.map((c) => `- ${c}`).join("\n")}
${studentBlock("student_claim", `Claim: "${claim.text}"`)}

Write:
- "explanation": a short explanation (at most 120 words, markdown allowed) teaching exactly those concepts, in the context of the claim.
- "exercise": ONE small hands-on exercise (coding or reasoning, doable in under an hour) that practises them, ending with a clear "Done when" check.
No generic advice such as "read the docs" or "practice more".

Output JSON: { "explanation": string, "exercise": string }`;
}
