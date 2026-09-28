export type Pixel = { x: number; y: number };
const distance = (a: Pixel, b: Pixel) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a: Pixel, b: Pixel, c: Pixel) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

export function validPolygon(points: Pixel[]): boolean {
  if (points.length < 3) return false;
  const area = points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p.x * q.y - q.x * p.y; }, 0);
  if (Math.abs(area) < 4) return false;
  const intersects = (a: Pixel, b: Pixel, c: Pixel, d: Pixel) => {
    const on = (p: Pixel, q: Pixel, r: Pixel) => cross(p, q, r) === 0 && r.x >= Math.min(p.x, q.x) && r.x <= Math.max(p.x, q.x) && r.y >= Math.min(p.y, q.y) && r.y <= Math.max(p.y, q.y);
    return (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) || on(a, b, c) || on(a, b, d) || on(c, d, a) || on(c, d, b);
  };
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      if (intersects(points[i], points[(i + 1) % points.length], points[j], points[(j + 1) % points.length])) return false;
    }
  }
  return true;
}

/** DOM pointer events avoid Google overlays swallowing boundary clicks. */
export function bindPolygonDrawing(element: HTMLElement, callbacks: {
  change: (points: Pixel[], cursor?: Pixel) => void;
  finish: (points: Pixel[]) => void;
  cancel: () => void;
  invalid: () => void;
}) {
  const points: Pixel[] = [];
  let pointer: number | null = null;
  let start: Pixel | null = null;
  let completed = false;
  const point = (event: PointerEvent): Pixel => {
    const rect = element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const finish = () => {
    if (completed) return;
    if (!validPolygon(points)) { callbacks.invalid(); return; }
    completed = true;
    callbacks.finish([...points]);
  };
  const undo = () => { if (!completed) { points.pop(); callbacks.change([...points]); } };
  const release = () => {
    const id = pointer;
    pointer = null; start = null;
    if (id !== null && element.hasPointerCapture(id)) element.releasePointerCapture(id);
  };
  const down = (event: PointerEvent) => {
    if (completed || pointer !== null || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    pointer = event.pointerId; start = point(event);
    element.setPointerCapture(pointer);
    element.focus({ preventScroll: true });
  };
  const move = (event: PointerEvent) => {
    if (!completed && (pointer === null || pointer === event.pointerId)) callbacks.change([...points], point(event));
  };
  const up = (event: PointerEvent) => {
    if (completed || pointer !== event.pointerId || !start) return;
    event.preventDefault();
    const next = point(event);
    const tapped = distance(start, next) < 8;
    release();
    if (!tapped) return;
    if (points.length >= 3 && distance(points[0], next) <= 12) { finish(); return; }
    // The second click of a double-click must not create a duplicate vertex.
    if (points.some((p) => distance(p, next) < 3)) return;
    points.push(next);
    callbacks.change([...points]);
  };
  const cancelPointer = (event: PointerEvent) => { if (event.pointerId === pointer) release(); };
  const doubleClick = (event: MouseEvent) => { event.preventDefault(); finish(); };
  const key = (event: KeyboardEvent) => {
    if (event.key === "Enter") { event.preventDefault(); finish(); }
    if (event.key === "Backspace" || event.key === "Delete") { event.preventDefault(); undo(); }
    if (event.key === "Escape") { event.preventDefault(); callbacks.cancel(); }
  };
  element.addEventListener("pointerdown", down);
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", up);
  element.addEventListener("pointercancel", cancelPointer);
  element.addEventListener("lostpointercapture", cancelPointer);
  element.addEventListener("dblclick", doubleClick);
  element.addEventListener("keydown", key);
  return { finish, undo, cleanup: () => {
    completed = true;
    element.removeEventListener("pointerdown", down);
    element.removeEventListener("pointermove", move);
    element.removeEventListener("pointerup", up);
    element.removeEventListener("pointercancel", cancelPointer);
    element.removeEventListener("lostpointercapture", cancelPointer);
    element.removeEventListener("dblclick", doubleClick);
    element.removeEventListener("keydown", key);
    release();
  } };
}
