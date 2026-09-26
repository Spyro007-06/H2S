import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { Logger } from "../logger.js";
import type { RawGrade } from "../core/rules.js";
import { LlmError, type LLMProvider } from "./provider.js";
import { ExtractOutput, FixTaskOutput, GradeOutput, QuestionOutput, RewriteOutput } from "./schemas.js";
import { clarifyPrompt } from "./prompts/clarify.js";
import { extractPrompt } from "./prompts/extract.js";
import { fixTaskPrompt } from "./prompts/fixTask.js";
import { gradePrompt } from "./prompts/grade.js";
import { questionPrompt } from "./prompts/question.js";
import { retestPrompt } from "./prompts/retest.js";
import { rewritePrompt } from "./prompts/rewrite.js";
import { SYSTEM_RULES } from "./prompts/shared.js";

export const LLM_TIMEOUT_MS = 25_000;
const RETRY_NOTE = "\n\nYour previous output was invalid JSON for the schema. Return only valid JSON.";

const TEMPERATURE = { precise: 0.2, creative: 0.7 } as const;

export interface GeminiOptions {
  apiKey?: string;
  model: string;
  vertexai?: boolean;
  project?: string;
  location?: string;
  logger: Logger;
  timeoutMs?: number;
}

/** zod → JSON Schema for Gemini structured output (strip keywords the API doesn't accept). */
function jsonSchema(schema: z.ZodType): unknown {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, { target: "draft-7" }) as Record<string, unknown>;
  return rest;
}

/** Live provider: structured JSON output, 25 s timeout, one retry on invalid JSON / schema mismatch. */
export class GeminiProvider implements LLMProvider {
  readonly mode = "live" as const;
  readonly model: string;
  private readonly ai: GoogleGenAI;
  private readonly logger: Logger;
  private readonly timeoutMs: number;

  constructor(opts: GeminiOptions) {
    this.model = opts.model;
    this.logger = opts.logger;
    this.timeoutMs = opts.timeoutMs ?? LLM_TIMEOUT_MS;
    this.ai = opts.vertexai
      ? new GoogleGenAI({ vertexai: true, apiKey: opts.apiKey, project: opts.project, location: opts.location })
      : new GoogleGenAI({ apiKey: opts.apiKey });
  }

  async extractClaims({ role, resumeText }: Parameters<LLMProvider["extractClaims"]>[0]) {
    const out = await this.call("extract", extractPrompt(role, resumeText), ExtractOutput, TEMPERATURE.precise);
    return out.claims;
  }

  async question(ctx: Parameters<LLMProvider["question"]>[0]) {
    return (await this.call("question", questionPrompt(ctx), QuestionOutput, TEMPERATURE.creative)).question;
  }

  async clarify(ctx: Parameters<LLMProvider["clarify"]>[0]) {
    return (await this.call("clarify", clarifyPrompt(ctx), QuestionOutput, TEMPERATURE.creative)).question;
  }

  async retestQuestion(ctx: Parameters<LLMProvider["retestQuestion"]>[0]) {
    return (await this.call("retest", retestPrompt(ctx), QuestionOutput, TEMPERATURE.creative)).question;
  }

  async grade(ctx: Parameters<LLMProvider["grade"]>[0]): Promise<RawGrade> {
    return this.call("grade", gradePrompt(ctx), GradeOutput, TEMPERATURE.precise);
  }

  async fixTask({ role, claim, missingConcepts }: Parameters<LLMProvider["fixTask"]>[0]) {
    return this.call("fixtask", fixTaskPrompt(role, claim, missingConcepts), FixTaskOutput, TEMPERATURE.precise);
  }

  async rewrite({ claim, evidenceSummary }: Parameters<LLMProvider["rewrite"]>[0]) {
    return (await this.call("rewrite", rewritePrompt(claim, evidenceSummary), RewriteOutput, TEMPERATURE.precise)).rewrite;
  }

  private async call<T>(name: string, prompt: string, schema: z.ZodType<T>, temperature: number): Promise<T> {
    const responseJsonSchema = jsonSchema(schema);
    for (let attempt = 1; attempt <= 2; attempt++) {
      const started = performance.now();
      const text = await this.generate(name, attempt === 1 ? prompt : prompt + RETRY_NOTE, responseJsonSchema, temperature, started);
      const parsed = safeJson(text);
      const result = parsed === undefined ? null : schema.safeParse(parsed);
      const ms = Math.round(performance.now() - started);
      if (result?.success) {
        this.logger.info({ prompt: name, attempt, ms, valid: true }, "llm call");
        return result.data;
      }
      this.logger.warn({ prompt: name, attempt, ms, valid: false }, "llm call returned invalid output");
    }
    throw new LlmError("LLM_INVALID_OUTPUT", `${name}: invalid output after retry`);
  }

  private async generate(name: string, prompt: string, responseJsonSchema: unknown, temperature: number, started: number): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_RULES,
          temperature,
          responseMimeType: "application/json",
          responseJsonSchema,
          abortSignal: controller.signal,
          httpOptions: { timeout: this.timeoutMs },
        },
      });
      return res.text ?? "";
    } catch (err) {
      const ms = Math.round(performance.now() - started);
      if (controller.signal.aborted || isTimeout(err)) {
        this.logger.warn({ prompt: name, ms }, "llm call timed out");
        throw new LlmError("LLM_TIMEOUT", `${name}: timed out after ${this.timeoutMs} ms`);
      }
      // Network / API errors (quota, auth, 5xx) are treated as invalid output: the caller degrades gracefully.
      this.logger.warn({ prompt: name, ms, error: errorMessage(err) }, "llm call failed");
      throw new LlmError("LLM_INVALID_OUTPUT", `${name}: request failed`);
    } finally {
      clearTimeout(timer);
    }
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isTimeout(err: unknown): boolean {
  return err instanceof Error && /abort|timed? ?out/i.test(`${err.name} ${err.message}`);
}

/** Error text for logs, with anything key-like scrubbed. */
function errorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/(key=|AIza|AQ\.)[A-Za-z0-9._-]+/g, "$1[redacted]").slice(0, 300);
}
