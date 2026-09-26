import type { Claim, Role } from "@/types/contract";
import { buildReport } from "./report";

/**
 * Static "finished session" fixture for GET /api/demo/report — a fully
 * assessed scenario built with the same buildReport() the live mock uses,
 * not a separate hand-tuned data model.
 */
function demoClaims(): Claim[] {
  return [
    {
      id: "CL-DEMO-1",
      text: "Built a React dashboard with optimized rendering",
      resume_line: "Developed a responsive dashboard using React, TypeScript, and REST APIs.",
      skill_id: "react_state",
      source: "resume",
      verdict: "shaky",
      levels_passed: 1,
      proficiency: 0.25,
      missing_concepts: ["State update -> re-render -> commit sequence"],
      evidence: [
        { level: 1, criterion: "ownership", passed: true, quote: "I built the filter panel and the chart view" },
        { level: 2, criterion: "mechanism", passed: false, quote: "React re-renders because hooks make it faster" },
      ],
      qa: [
        {
          level: 1,
          kind: "question",
          mode: "assess",
          question: 'Walk me through "Built a React dashboard" — what did you personally build?',
          answer: "I built the filter panel and the chart view using useState and useEffect.",
          grade: null,
          asked_at: "2026-01-01T10:00:00Z",
        },
        {
          level: 2,
          kind: "question",
          mode: "assess",
          question: "How does react state & rendering actually work under the hood in what you built?",
          answer: "React re-renders because hooks make it faster.",
          grade: null,
          asked_at: "2026-01-01T10:02:00Z",
        },
      ],
      retest: null,
      fix_task: null,
      rewrite: "Built dashboard UI components in React (filter panel, charts)",
      root_cause: "Confused hooks with a performance optimization rather than the render mechanism itself.",
      retest_status: "due",
    },
    {
      id: "CL-DEMO-2",
      text: "Strong in JavaScript fundamentals and ES6",
      resume_line: "Strong in JavaScript fundamentals and ES6.",
      skill_id: "js_fundamentals",
      source: "resume",
      verdict: "defended",
      levels_passed: 3,
      proficiency: 0.85,
      missing_concepts: [],
      evidence: [
        { level: 1, criterion: "specificity", passed: true, quote: "I used closures for the debounce utility" },
        { level: 2, criterion: "mechanism", passed: true, quote: "microtasks run before the next macrotask" },
        { level: 3, criterion: "tradeoff", passed: true, quote: "async/await instead of raw promises for readability" },
      ],
      qa: [],
      retest: null,
      fix_task: null,
      rewrite: null,
    },
    {
      id: "CL-DEMO-3",
      text: "Integrated REST APIs with JWT authentication",
      resume_line: "Integrated REST APIs with JWT authentication.",
      skill_id: "rest_apis",
      source: "resume",
      verdict: "bluff",
      levels_passed: 0,
      proficiency: 0,
      missing_concepts: ["How a JWT is attached to a request and validated"],
      evidence: [{ level: 1, criterion: "accuracy", passed: false, quote: "I just used the login button" }],
      qa: [],
      retest: null,
      fix_task: null,
      rewrite: "Consumed REST APIs from the frontend",
      root_cause: "Never implemented the auth header logic personally — relied on a shared client.",
    },
    {
      id: "CL-DEMO-4",
      text: "Knows Accessibility",
      resume_line: null,
      skill_id: "accessibility",
      source: "declared",
      verdict: "honest_gap",
      levels_passed: 0,
      proficiency: 0,
      missing_concepts: [],
      evidence: [],
      qa: [],
      retest: null,
      fix_task: null,
      rewrite: null,
    },
  ];
}

export function buildDemoReport(role: Role): ReturnType<typeof buildReport> {
  const claims = demoClaims();
  const blindSpots = role.skills
    .filter((s) => !claims.some((c) => c.skill_id === s.id))
    .map((s) => ({ skill_id: s.id, name: s.name, weight: s.weight }));
  return buildReport("s_demo", role, claims, blindSpots);
}
