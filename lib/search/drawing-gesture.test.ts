import { describe, expect, it, vi } from "vitest";
import { bindDrawingGesture, rectangleBounds } from "./drawing-gesture";
import { isPointInsideShape } from "../filter-listings";

function setup() {
  const captured = new Set<number>();
  const surface = Object.assign(new EventTarget(), {
    getBoundingClientRect: () => ({ left: 10, top: 20 }),
    setPointerCapture: vi.fn((id: number) => captured.add(id)),
    hasPointerCapture: (id: number) => captured.has(id),
    releasePointerCapture: vi.fn((id: number) => captured.delete(id)),
  });
  const callbacks = { start: vi.fn(), move: vi.fn(), finish: vi.fn(), cancel: vi.fn() };
  const cleanup = bindDrawingGesture(surface as unknown as HTMLElement, callbacks);
  const send = (type: string, values: Record<string, unknown> = {}) => {
    const event = Object.assign(new Event(type, { cancelable: true }), {
      pointerId: 1, isPrimary: true, button: 0, clientX: 100, clientY: 100, ...values,
    });
    surface.dispatchEvent(event);
    return event;
  };
  return { surface, callbacks, cleanup, send };
}

describe("map drawing gestures", () => {
  it.each(["mouse", "touch", "pen"])("finishes a %s drag outside the map using pointer capture", (pointerType) => {
    const { surface, callbacks, send } = setup();
    send("pointerdown", { pointerType });
    expect(surface.setPointerCapture).toHaveBeenCalledWith(1);
    expect(callbacks.start).toHaveBeenCalledWith({ x: 90, y: 80 });
    send("pointermove", { pointerType, clientX: -100, clientY: 300 });
    send("pointerup", { pointerType, clientX: -120, clientY: 320 });
    expect(callbacks.move).toHaveBeenCalledWith({ x: -110, y: 280 });
    expect(callbacks.finish).toHaveBeenCalledExactlyOnceWith({ x: -130, y: 300 });
    expect(surface.releasePointerCapture).toHaveBeenCalledWith(1);
    send("lostpointercapture");
    expect(callbacks.cancel).not.toHaveBeenCalled();
  });
  it("does not let a second finger finish the first gesture", () => {
    const { callbacks, send } = setup();
    send("pointerdown");
    send("pointerdown", { pointerId: 2, isPrimary: false });
    send("pointerup", { pointerId: 2, clientX: 300 });
    expect(callbacks.start).toHaveBeenCalledTimes(1);
    expect(callbacks.finish).not.toHaveBeenCalled();
    send("pointerup", { clientX: 200 });
    expect(callbacks.finish).toHaveBeenCalledTimes(1);
  });
  it.each(["pointercancel", "lostpointercapture"])("discards unfinished geometry on %s", (event) => {
    const { callbacks, send } = setup();
    send("pointerdown");
    send(event);
    send("pointerup", { clientX: 200 });
    expect(callbacks.cancel).toHaveBeenCalledTimes(1);
    expect(callbacks.finish).not.toHaveBeenCalled();
  });
  it("rejects taps and right-clicks instead of applying an empty area", () => {
    const { callbacks, send } = setup();
    send("pointerdown", { button: 2 });
    expect(callbacks.start).not.toHaveBeenCalled();
    send("pointerdown");
    send("pointerup", { clientX: 101 });
    expect(callbacks.cancel).toHaveBeenCalledTimes(1);
    expect(callbacks.finish).not.toHaveBeenCalled();
  });
  it("cleans up capture and handlers when tools switch or the map unmounts", () => {
    const { callbacks, surface, send, cleanup } = setup();
    send("pointerdown");
    cleanup();
    expect(surface.hasPointerCapture(1)).toBe(false);
    send("pointermove", { clientX: 200 });
    send("pointerup", { clientX: 200 });
    expect(callbacks.move).not.toHaveBeenCalled();
    expect(callbacks.finish).not.toHaveBeenCalled();
  });
});

describe("box search geometry", () => {
  it.each([
    [{ lat: 34, lng: -113 }, { lat: 33, lng: -112 }],
    [{ lat: 33, lng: -112 }, { lat: 34, lng: -113 }],
    [{ lat: 33, lng: -113 }, { lat: 34, lng: -112 }],
    [{ lat: 34, lng: -112 }, { lat: 33, lng: -113 }],
  ])("filters the same pocket when dragged from %j to %j", (start, end) => {
    const bounds = rectangleBounds(start, end);
    expect(bounds).toEqual({ north: 34, south: 33, east: -112, west: -113 });
    expect(isPointInsideShape(33.5, -112.5, { type: "rectangle", bounds })).toBe(true);
    expect(isPointInsideShape(35, -112.5, { type: "rectangle", bounds })).toBe(false);
  });
});
