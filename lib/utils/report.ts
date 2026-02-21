import type {
  ConfigSnapshot,
  ReportsRow,
} from "@/types/database";

export interface ExecutiveSummary {
  bullets: string[];
}

export interface ActionItem {
  text: string;
  perspective?: string;
}

export function parseExecutiveSummary(
  jsonb: ReportsRow["executive_summary"]
): ExecutiveSummary | null {
  if (!jsonb || typeof jsonb !== "object") return null;
  const parsed = jsonb as { bullets?: unknown };
  if (!Array.isArray(parsed.bullets)) return null;
  const bullets = parsed.bullets.filter(
    (b): b is string => typeof b === "string"
  );
  return bullets.length > 0 ? { bullets } : null;
}

export function parseActionItem(
  jsonb: ReportsRow["action_item"]
): ActionItem | null {
  if (!jsonb || typeof jsonb !== "object") return null;
  const parsed = jsonb as { text?: unknown; perspective?: unknown };
  if (typeof parsed.text !== "string") return null;
  return {
    text: parsed.text,
    perspective:
      typeof parsed.perspective === "string" ? parsed.perspective : undefined,
  };
}

export function parseConfigSnapshot(
  jsonb: ReportsRow["config_snapshot"]
): ConfigSnapshot | null {
  if (!jsonb || typeof jsonb !== "object") return null;
  const p = jsonb as unknown as Record<string, unknown>;
  if (!Array.isArray(p.sources) || !Array.isArray(p.keywords)) return null;
  return jsonb as ConfigSnapshot;
}
