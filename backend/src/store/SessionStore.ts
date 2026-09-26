import type { Claim, SkillHistoryEntry } from "../types.js";
import type { Cursor } from "../core/stateMachine.js";

/** Server-side session. Never sent to the client as-is. */
export interface Session {
  id: string;
  role_id: string;
  created_at: string;
  resume_text: string | null;
  declared_skills: string[];
  claims: Claim[];
  next_seq: number;
  /** In-progress ladders keyed by claim id. */
  cursors: Record<string, Cursor>;
  history: (SkillHistoryEntry & { skill_id: string })[];
  /** How many criteria the evidence guard forced to false in this session. */
  guard_flips: number;
}

export interface SessionStore {
  get(id: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
}
