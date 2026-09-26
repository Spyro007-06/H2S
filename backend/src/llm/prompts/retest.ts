import type { QuestionContext } from "../provider.js";
import { claimHeader } from "./question.js";
import { criteriaList, LEVEL_FOCUS } from "./shared.js";

export function retestPrompt(
  ctx: QuestionContext & { missingConcepts: string[]; previousQuestions: string[] },
): string {
  const previous = ctx.previousQuestions.map((q) => `- ${q}`).join("\n") || "- (none)";
  return `${claimHeader(ctx)}

This is a RETEST. The student previously failed to demonstrate:
${ctx.missingConcepts.map((c) => `- ${c}`).join("\n")}

Write ONE new, realistic scenario question at Level ${ctx.level} (${LEVEL_FOCUS[ctx.level]}) that tests these exact concepts through application: debugging a failure, a changed requirement, or an unfamiliar case.

What a good answer must show:
${criteriaList(ctx.skill, ctx.level)}

Do NOT repeat or paraphrase any of these previous questions:
${previous}

One short question, no hints, no multi-part questions.

Output JSON: { "question": string }`;
}
