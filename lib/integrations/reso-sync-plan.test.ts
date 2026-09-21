import { describe, expect, it } from "vitest";
import { BOOTSTRAP_STATUSES, OVERLAP_MS, resolveSyncPlan, SCOPE_VERSION, VALLEY_COUNTIES } from "./reso-sync-plan";

const now = new Date("2026-09-20T12:00:00.000Z");
const wm = "2026-09-20T10:00:00.000Z";

describe("resolveSyncPlan", () => {
  it("bootstraps when there are no runs", () => {
    const p = resolveSyncPlan(null, now);
    expect(p.kind).toBe("bootstrap");
    expect(p.scope).toEqual({ statuses: BOOTSTRAP_STATUSES, counties: VALLEY_COUNTIES });
    expect(p.control.meta).toEqual({ watermark: now.toISOString(), scope: p.scope, scopeVersion: SCOPE_VERSION });
    expect(p.control.resumeUrl).toBeUndefined();
  });

  it("bootstraps when a completed run has no scopeVersion", () => {
    expect(resolveSyncPlan({ status: "completed", rawMeta: { watermark: wm } }, now).kind).toBe("bootstrap");
  });

  it("runs incremental after a completed run at the current scopeVersion", () => {
    const p = resolveSyncPlan({ status: "completed", rawMeta: { watermark: wm, scopeVersion: SCOPE_VERSION } }, now);
    expect(p.kind).toBe("incremental");
    expect(p.scope).toEqual({ modifiedSince: new Date(new Date(wm).getTime() - OVERLAP_MS).toISOString(), counties: VALLEY_COUNTIES });
    expect(p.control.meta?.watermark).toBe(now.toISOString());
    expect(p.control.meta?.scopeVersion).toBe(SCOPE_VERSION);
  });

  it("treats completed_with_errors at the current scopeVersion as incremental", () => {
    const p = resolveSyncPlan({ status: "completed_with_errors", rawMeta: { watermark: wm, scopeVersion: SCOPE_VERSION } }, now);
    expect(p.kind).toBe("incremental");
  });

  it("bootstraps when completed_with_errors has no scopeVersion", () => {
    expect(resolveSyncPlan({ status: "completed_with_errors", rawMeta: { watermark: wm } }, now).kind).toBe("bootstrap");
  });

  it("bootstraps when a partial run has no scopeVersion", () => {
    const rawMeta = { watermark: wm, resumeUrl: "https://x/next", scope: { statuses: ["Active"] } };
    expect(resolveSyncPlan({ status: "partial", rawMeta }, now).kind).toBe("bootstrap");
  });

  it("resumes a partial run at the current scopeVersion with a resumeUrl", () => {
    const scope = { statuses: ["Active"] };
    const p = resolveSyncPlan({ status: "partial", rawMeta: { watermark: wm, resumeUrl: "https://x/next", scope, scopeVersion: SCOPE_VERSION } }, now);
    expect(p.kind).toBe("resume-partial");
    expect(p.scope).toEqual(scope);
    expect(p.control.resumeUrl).toBe("https://x/next");
    expect(p.control.meta).toEqual({ watermark: wm, scope, scopeVersion: SCOPE_VERSION });
  });

  it("bootstraps a partial run missing its resumeUrl", () => {
    expect(resolveSyncPlan({ status: "partial", rawMeta: { watermark: wm, scope: {}, scopeVersion: SCOPE_VERSION } }, now).kind).toBe("bootstrap");
  });
});
