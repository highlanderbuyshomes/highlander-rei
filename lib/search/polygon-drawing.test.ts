import { describe, expect, it, vi } from "vitest";
import { bindPolygonDrawing, validPolygon } from "./polygon-drawing";

function setup() {
  const captured = new Set<number>();
  const element = Object.assign(new EventTarget(), {
    getBoundingClientRect: () => ({ left: 0, top: 0 }), focus: vi.fn(),
    setPointerCapture: (id: number) => captured.add(id),
    hasPointerCapture: (id: number) => captured.has(id),
    releasePointerCapture: (id: number) => captured.delete(id),
  });
  const callbacks = { change: vi.fn(), finish: vi.fn(), cancel: vi.fn(), invalid: vi.fn() };
  const controller = bindPolygonDrawing(element as unknown as HTMLElement, callbacks);
  const send = (type: string, values = {}) => element.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), { pointerId: 1, isPrimary: true, button: 0, clientX: 0, clientY: 0, ...values }));
  const tap = (x: number, y: number, pointerType = "mouse") => { send("pointerdown", { clientX: x, clientY: y, pointerType }); send("pointerup", { clientX: x, clientY: y, pointerType }); };
  return { ...controller, callbacks, tap, send };
}

describe("polygon drawing", () => {
  it.each(["mouse", "touch", "pen"])("adds corners and closes by tapping the first point with %s", (type) => {
    const { tap, callbacks } = setup();
    tap(20, 20, type); tap(200, 20, type); tap(200, 200, type); tap(20, 200, type);
    expect(callbacks.finish).not.toHaveBeenCalled();
    tap(23, 23, type);
    expect(callbacks.finish).toHaveBeenCalledExactlyOnceWith([{ x: 20, y: 20 }, { x: 200, y: 20 }, { x: 200, y: 200 }, { x: 20, y: 200 }]);
  });
  it("previews the next edge without adding a vertex", () => {
    const { tap, send, callbacks } = setup();
    tap(20, 20); send("pointermove", { clientX: 100, clientY: 80 });
    expect(callbacks.change).toHaveBeenLastCalledWith([{ x: 20, y: 20 }], { x: 100, y: 80 });
  });
  it("double-clicks finish without duplicating the final vertex", () => {
    const { tap, send, callbacks } = setup();
    tap(20, 20); tap(200, 20); tap(200, 200); tap(200, 200); send("dblclick");
    expect(callbacks.finish.mock.calls[0][0]).toHaveLength(3);
  });
  it("supports undo and keyboard finish", () => {
    const { tap, send, callbacks } = setup();
    tap(20, 20); tap(200, 20); tap(200, 200); tap(100, 100);
    send("keydown", { key: "Backspace" }); send("keydown", { key: "Enter" });
    expect(callbacks.finish.mock.calls[0][0]).toHaveLength(3);
  });
  it("rejects incomplete or crossing shapes without applying a filter", () => {
    const { tap, finish, callbacks, undo } = setup();
    tap(20, 20); tap(200, 200); finish();
    expect(callbacks.invalid).toHaveBeenCalledTimes(1);
    tap(20, 200); tap(200, 20); finish();
    expect(callbacks.invalid).toHaveBeenCalledTimes(2);
    expect(callbacks.finish).not.toHaveBeenCalled();
    undo(); finish(); expect(callbacks.finish).toHaveBeenCalledTimes(1);
  });
  it("ignores drags, secondary pointers and cancelled taps", () => {
    const { send, callbacks } = setup();
    send("pointerdown"); send("pointerup", { clientX: 100 });
    send("pointerdown", { isPrimary: false, pointerId: 2 }); send("pointerup", { pointerId: 2 });
    send("pointerdown"); send("pointercancel"); send("pointerup");
    expect(callbacks.change).not.toHaveBeenCalled();
  });
  it("Escape cancels and cleanup removes event handlers", () => {
    const { send, tap, cleanup, callbacks } = setup();
    send("keydown", { key: "Escape" }); expect(callbacks.cancel).toHaveBeenCalledTimes(1);
    cleanup(); tap(20, 20); expect(callbacks.change).not.toHaveBeenCalled();
  });
  it("rejects collinear points and accepts concave boundaries", () => {
    expect(validPolygon([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }])).toBe(false);
    expect(validPolygon([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 100 }, { x: 0, y: 100 }])).toBe(true);
  });
});
