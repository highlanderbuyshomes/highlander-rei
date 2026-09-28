type Pixel = { x: number; y: number };

/** Capture a single mouse, pen, or touch drag even when it leaves the map. */
export function bindDrawingGesture(element: HTMLElement, callbacks: {
  start: (point: Pixel) => void;
  move: (point: Pixel) => void;
  finish: (point: Pixel) => void;
  cancel: () => void;
}) {
  let pointer: number | null = null;
  let start: Pixel | null = null;
  const point = (event: PointerEvent): Pixel => {
    const bounds = element.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };
  const release = () => {
    const id = pointer;
    pointer = null;
    start = null;
    if (id !== null && element.hasPointerCapture(id)) element.releasePointerCapture(id);
  };
  const down = (event: PointerEvent) => {
    if (pointer !== null || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    pointer = event.pointerId;
    start = point(event);
    element.setPointerCapture(pointer);
    callbacks.start(start);
  };
  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    event.preventDefault();
    callbacks.move(point(event));
  };
  const up = (event: PointerEvent) => {
    if (event.pointerId !== pointer || !start) return;
    event.preventDefault();
    const end = point(event);
    const moved = Math.hypot(end.x - start.x, end.y - start.y) >= 4;
    release();
    if (moved) callbacks.finish(end);
    else callbacks.cancel();
  };
  const cancel = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    release();
    callbacks.cancel();
  };
  element.addEventListener("pointerdown", down);
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", up);
  element.addEventListener("pointercancel", cancel);
  element.addEventListener("lostpointercapture", cancel);
  return () => {
    element.removeEventListener("pointerdown", down);
    element.removeEventListener("pointermove", move);
    element.removeEventListener("pointerup", up);
    element.removeEventListener("pointercancel", cancel);
    element.removeEventListener("lostpointercapture", cancel);
    release();
  };
}

/** MLS coverage is local; normalize corners instead of assuming SW-to-NE drags. */
export function rectangleBounds(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return { north: Math.max(a.lat, b.lat), south: Math.min(a.lat, b.lat), east: Math.max(a.lng, b.lng), west: Math.min(a.lng, b.lng) };
}
