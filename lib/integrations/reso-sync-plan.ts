import type { ResoScopeOpts } from "./reso";
import type { ResoSyncControl } from "./reso-sync";

// Bump SCOPE_VERSION when the sync scope widens: older completed runs are then
// treated as having no watermark, forcing one fresh bootstrap.
export const SCOPE_VERSION = 2;
export const BOOTSTRAP_STATUSES = ["Active", "Active Under Contract", "Pending"];
// Re-fetch a little before the last run's start so a listing modified while
// that run was mid-flight isn't missed; writes are idempotent.
export const OVERLAP_MS = 5 * 60_000;
/** ImportRun statuses that can carry a watermark / resume point. */
export const PLAN_STATUSES = ["completed", "completed_with_errors", "partial"];

export type LatestRun = { status: string; rawMeta: unknown } | null;

export type SyncPlan = {
  kind: "bootstrap" | "resume-partial" | "incremental";
  scope: ResoScopeOpts;
  control: ResoSyncControl;
};

type Meta = { watermark?: string; resumeUrl?: string; scope?: ResoScopeOpts; scopeVersion?: number };

/**
 * Picks which sync to run from the latest usable ImportRun. A run that
 * reached the end of the feed ("completed" or "completed_with_errors") is a
 * finished pass for watermark purposes; only "partial" carries a resume URL.
 * Runs from before the current SCOPE_VERSION are ignored (fresh bootstrap).
 */
export function resolveSyncPlan(latest: LatestRun, now: Date = new Date()): SyncPlan {
  const meta = ((latest?.rawMeta ?? {}) as Meta) || {};
  const startedNow = now.toISOString();
  const current = meta.scopeVersion === SCOPE_VERSION;

  if (latest?.status === "partial" && current && meta.resumeUrl && meta.scope && meta.watermark) {
    const scope = meta.scope;
    return { kind: "resume-partial", scope, control: { resumeUrl: meta.resumeUrl, meta: { watermark: meta.watermark, scope, scopeVersion: SCOPE_VERSION } } };
  }
  if ((latest?.status === "completed" || latest?.status === "completed_with_errors") && current && meta.watermark) {
    const scope: ResoScopeOpts = { modifiedSince: new Date(new Date(meta.watermark).getTime() - OVERLAP_MS).toISOString() };
    return { kind: "incremental", scope, control: { meta: { watermark: startedNow, scope, scopeVersion: SCOPE_VERSION } } };
  }
  const scope: ResoScopeOpts = { statuses: BOOTSTRAP_STATUSES };
  return { kind: "bootstrap", scope, control: { meta: { watermark: startedNow, scope, scopeVersion: SCOPE_VERSION } } };
}
