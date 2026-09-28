"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { bindDrawingGesture, rectangleBounds } from "@/lib/search/drawing-gesture";
import { bindPolygonDrawing, type Pixel } from "@/lib/search/polygon-drawing";
import { loadGoogleMaps } from "./load-google-maps";
import type { DrawnShape, ListingRecord, Pin } from "@/lib/search/types";
import styles from "./search.module.css";

type DrawingMode = "pan" | "rectangle" | "circle" | "polygon";
type MapShape = google.maps.Polygon | google.maps.Rectangle | google.maps.Circle;



function money(value: number | null, compact = false) {
  if (value == null) return "—";
  if (compact && value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (compact && value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function normalizeStatus(value: string) {
  const status = value.toLowerCase();
  if (status.includes("coming")) return "Coming Soon";
  if (status.includes("active")) return "Active";
  if (status.includes("pending") || status.includes("contract")) return "Pending";
  if (status.includes("expire")) return "Expired";
  if (status.includes("cancel") || status.includes("withdraw")) return "Canceled";
  if (status.includes("closed") || status.includes("sold")) return "Closed";
  return value || "Off Market";
}

/** Google shape -> the plain geometry the server re-applies to every match. */
function toDrawnShape(shape: MapShape): DrawnShape {
  if (shape instanceof google.maps.Rectangle) {
    const bounds = shape.getBounds()!;
    return {
      type: "rectangle",
      bounds: {
        north: bounds.getNorthEast().lat(),
        east: bounds.getNorthEast().lng(),
        south: bounds.getSouthWest().lat(),
        west: bounds.getSouthWest().lng(),
      },
    };
  }
  if (shape instanceof google.maps.Circle) {
    const center = shape.getCenter()!;
    return { type: "circle", center: { lat: center.lat(), lng: center.lng() }, radiusMeters: shape.getRadius() };
  }
  return { type: "polygon", path: shape.getPath().getArray().map((point) => ({ lat: point.lat(), lng: point.lng() })) };
}

const shapeStyle = {
  fillColor: "#1685d2",
  fillOpacity: 0.14,
  strokeColor: "#0b6ead",
  strokeOpacity: 1,
  strokeWeight: 2,
};

export default function GoogleMapStage({
  pins,
  selected,
  total,
  onSelect,
  onShapeChange,
  hasArea,
  loading,
}: {
  pins: Pin[];
  selected: ListingRecord | null;
  total: number;
  onSelect: (id: string) => void;
  onShapeChange: (shape: DrawnShape | null, showMatches?: boolean) => void;
  hasArea: boolean;
  loading: boolean;
}) {
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const activeShape = useRef<MapShape | null>(null);
  const drawingListeners = useRef<google.maps.MapsEventListener[]>([]);
  const shapeListeners = useRef<google.maps.MapsEventListener[]>([]);
  const dragStart = useRef<google.maps.LatLng | null>(null);
  const projection = useRef<google.maps.OverlayView | null>(null);
  const cleanupGesture = useRef<(() => void) | null>(null);
  const isDrawing = useRef(false);
  const polygonControls = useRef<ReturnType<typeof bindPolygonDrawing> | null>(null);
  const lastFitPins = useRef<Pin[] | null>(null);
  const onSelectRef = useRef(onSelect);
  const onShapeChangeRef = useRef(onShapeChange);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("pan");
  const [drawPoints, setDrawPoints] = useState(0);
  const [shapeActive, setShapeActive] = useState(false);
  const [error, setError] = useState("");
  const [drawingError, setDrawingError] = useState("");

  useEffect(() => {
    onSelectRef.current = onSelect;
    onShapeChangeRef.current = onShapeChange;
  }, [onSelect, onShapeChange]);

  function removeListeners(listeners: MutableRefObject<google.maps.MapsEventListener[]>) {
    listeners.current.forEach((listener) => listener.remove());
    listeners.current = [];
  }

  function refreshShape(showMatches = false) {
    if (!activeShape.current) return;
    setShapeActive(true);
    onShapeChangeRef.current(toDrawnShape(activeShape.current), showMatches);
  }

  function clearShape(notify = true) {
    cleanupGesture.current?.();
    cleanupGesture.current = null;
    polygonControls.current = null;
    setDrawingError("");
    isDrawing.current = false;
    markers.current.forEach((marker) => marker.setClickable(true));
    removeListeners(drawingListeners);
    removeListeners(shapeListeners);
    activeShape.current?.setMap(null);
    activeShape.current = null;
    dragStart.current = null;
    map.current?.setOptions({ draggable: true, draggableCursor: null, disableDoubleClickZoom: false, scrollwheel: true, keyboardShortcuts: true });
    setDrawingMode("pan");
    setDrawPoints(0);
    setShapeActive(false);
    if (notify) onShapeChangeRef.current(null);
  }

  function makeEditable(shape: MapShape) {
    removeListeners(shapeListeners);
    shape.setOptions({ clickable: true });
    shape.setEditable(true);
    shape.setDraggable(true);
    shapeListeners.current.push(shape.addListener("dragend", () => refreshShape()));
    if (shape instanceof google.maps.Rectangle) shapeListeners.current.push(shape.addListener("bounds_changed", () => refreshShape()));
    if (shape instanceof google.maps.Circle) {
      shapeListeners.current.push(shape.addListener("center_changed", () => refreshShape()));
      shapeListeners.current.push(shape.addListener("radius_changed", () => refreshShape()));
    }
    if (shape instanceof google.maps.Polygon) {
      const path = shape.getPath();
      shapeListeners.current.push(path.addListener("set_at", () => refreshShape()), path.addListener("insert_at", () => refreshShape()), path.addListener("remove_at", () => refreshShape()));
    }
    refreshShape(true);
  }

  function stopDrawing() {
    cleanupGesture.current?.();
    cleanupGesture.current = null;
    polygonControls.current = null;
    setDrawingError("");
    isDrawing.current = false;
    markers.current.forEach((marker) => marker.setClickable(true));
    removeListeners(drawingListeners);
    dragStart.current = null;
    map.current?.setOptions({ draggable: true, draggableCursor: null, disableDoubleClickZoom: false, scrollwheel: true, keyboardShortcuts: true });
    setDrawingMode("pan");
  }

  function beginPolygon() {
    if (!map.current || !mapNode.current || !projection.current?.getProjection()) return;
    clearShape();
    isDrawing.current = true;
    markers.current.forEach((marker) => marker.setClickable(false));
    const polygon = new google.maps.Polygon({ map: map.current, paths: [], clickable: false, ...shapeStyle });
    activeShape.current = polygon;
    setDrawingMode("polygon");
    map.current.setOptions({ draggable: false, draggableCursor: "crosshair", disableDoubleClickZoom: true, scrollwheel: false, keyboardShortcuts: false });
    const surface = document.createElement("div");
    surface.className = styles.drawingSurface;
    surface.tabIndex = 0;
    surface.setAttribute("aria-label", "Draw polygon: click corners, click the first point to close, Enter to finish, Backspace to undo, Escape to cancel");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add(styles.polygonPreview);
    surface.appendChild(svg);
    mapNode.current.parentElement!.appendChild(surface);
    surface.focus({ preventScroll: true });
    const toLatLng = (point: Pixel) => projection.current!.getProjection().fromContainerPixelToLatLng(new google.maps.Point(point.x, point.y))!;
    const controller = bindPolygonDrawing(surface, {
      change: (points, cursor) => {
        polygon.setPath(points.map(toLatLng));
        setDrawPoints(points.length);
        setDrawingError("");
        svg.replaceChildren();
        const line = document.createElementNS(svg.namespaceURI, "polyline");
        line.setAttribute("points", [...points, ...(cursor && points.length ? [cursor] : [])].map((p) => `${p.x},${p.y}`).join(" "));
        line.setAttribute("fill", "none"); line.setAttribute("stroke", "#1875f0"); line.setAttribute("stroke-width", "2");
        svg.appendChild(line);
        points.forEach((point, index) => {
          const dot = document.createElementNS(svg.namespaceURI, "circle");
          dot.setAttribute("cx", String(point.x)); dot.setAttribute("cy", String(point.y));
          dot.setAttribute("r", index === 0 ? "7" : "4");
          dot.setAttribute("fill", index === 0 ? "#fff" : "#1875f0");
          dot.setAttribute("stroke", "#1875f0"); dot.setAttribute("stroke-width", "2");
          svg.appendChild(dot);
        });
      },
      finish: (points) => {
        polygon.setPath(points.map(toLatLng));
        stopDrawing();
        makeEditable(polygon);
      },
      invalid: () => setDrawingError("Add at least 3 corners without crossing edges."),
      cancel: () => clearShape(),
    });
    polygonControls.current = controller;
    cleanupGesture.current = () => { controller.cleanup(); surface.remove(); };
  }

  function searchVisibleArea() {
    const bounds = map.current?.getBounds();
    if (!bounds || !map.current) return;
    clearShape();
    const rectangle = new google.maps.Rectangle({ map: map.current, bounds, ...shapeStyle });
    activeShape.current = rectangle;
    makeEditable(rectangle);
  }

  function beginDragShape(mode: "rectangle" | "circle") {
    if (!map.current || !mapNode.current || !projection.current?.getProjection()) return;
    clearShape();
    isDrawing.current = true;
    setDrawingMode(mode);
    map.current.setOptions({ draggable: false, draggableCursor: "crosshair", disableDoubleClickZoom: true, scrollwheel: false, keyboardShortcuts: false });

    // A separate surface prevents markers and the draft shape from swallowing
    // events. Pointer capture also handles touch and releases outside the map.
    const surface = document.createElement("div");
    surface.className = styles.drawingSurface;
    mapNode.current.parentElement!.appendChild(surface);
    const latLng = (point: { x: number; y: number }) =>
      projection.current?.getProjection().fromContainerPixelToLatLng(new google.maps.Point(point.x, point.y));
    const update = (point: { x: number; y: number }) => {
      const end = latLng(point);
      if (!end || !dragStart.current || !activeShape.current) return;
      if (activeShape.current instanceof google.maps.Rectangle) {
        activeShape.current.setBounds(rectangleBounds(dragStart.current.toJSON(), end.toJSON()));
      } else if (activeShape.current instanceof google.maps.Circle) {
        activeShape.current.setRadius(google.maps.geometry.spherical.computeDistanceBetween(dragStart.current, end));
      }
    };
    const cleanup = bindDrawingGesture(surface, {
      start: (point) => {
        const start = latLng(point);
        if (!start || !map.current) return;
        dragStart.current = start;
        activeShape.current = mode === "rectangle"
          ? new google.maps.Rectangle({ map: map.current, bounds: rectangleBounds(start.toJSON(), start.toJSON()), clickable: false, ...shapeStyle })
          : new google.maps.Circle({ map: map.current, center: start, radius: 0, clickable: false, ...shapeStyle });
      },
      move: update,
      finish: (point) => {
        update(point);
        const shape = activeShape.current;
        if (!shape || (shape instanceof google.maps.Rectangle && (shape.getBounds()!.getNorthEast().lat() === shape.getBounds()!.getSouthWest().lat() || shape.getBounds()!.getNorthEast().lng() === shape.getBounds()!.getSouthWest().lng()))) {
          clearShape();
          return;
        }
        stopDrawing();
        makeEditable(shape);
      },
      cancel: () => clearShape(),
    });
    cleanupGesture.current = () => { cleanup(); surface.remove(); };
  }

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (cancelled || !mapNode.current) return;
      map.current = new google.maps.Map(mapNode.current, {
        center: { lat: 33.4484, lng: -112.074 }, zoom: 10, mapTypeControl: false, fullscreenControl: false,
        streetViewControl: false, zoomControl: false, rotateControl: false, gestureHandling: "greedy", clickableIcons: false,
        styles: [{ featureType: "poi.business", stylers: [{ visibility: "off" }] }, { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] }, { featureType: "transit", stylers: [{ visibility: "off" }] }],
      });
      const overlay = new google.maps.OverlayView();
      overlay.onAdd = () => {};
      overlay.onRemove = () => {};
      overlay.draw = () => { if (!cancelled) setMapReady(true); };
      projection.current = overlay;
      overlay.setMap(map.current);
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Google Maps could not be loaded."));
    return () => {
      cancelled = true;
      cleanupGesture.current?.();
      projection.current?.setMap(null);
      drawingListeners.current.forEach((listener) => listener.remove());
      shapeListeners.current.forEach((listener) => listener.remove());
      markers.current.forEach((marker) => marker.setMap(null));
      activeShape.current?.setMap(null);
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapReady) return;
    map.current.setMapTypeId(mapType);
  }, [mapReady, mapType]);

  useEffect(() => {
    if (!map.current || !mapReady) return;
    markers.current.forEach((marker) => marker.setMap(null));
    markers.current = [];

    // Render the server's complete pin response for the selected area.
    // Never inject a previously selected listing from outside this search.
    const visible = hasArea && !loading ? pins : [];
    const bounds = new google.maps.LatLngBounds();
    visible.forEach((pin) => {
      const isSelected = pin.id === selected?.id;
      const marker = new google.maps.Marker({
        map: map.current, position: { lat: pin.lat, lng: pin.lng }, title: money(pin.price),
        clickable: !isDrawing.current,
        zIndex: isSelected ? 30 : pin.target ? 20 : 10,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: isSelected ? 7 : 4.5, fillColor: isSelected ? "#1464d2" : "#28852d", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 1.5 },
      });
      marker.addListener("click", () => onSelectRef.current(pin.id));
      markers.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    if (!isDrawing.current && !activeShape.current && !bounds.isEmpty() && lastFitPins.current !== pins) {
      lastFitPins.current = pins;
      map.current.fitBounds(bounds, 54);
      google.maps.event.addListenerOnce(map.current, "idle", () => { if ((map.current?.getZoom() ?? 0) > 13) map.current?.setZoom(13); });
    }
  }, [pins, mapReady, selected, hasArea, loading]);

  const drawingText = drawingMode === "polygon" ? `Click corners (${drawPoints}). Click the first point or Finish to close.` : drawingMode === "rectangle" ? "Click and drag corner-to-corner." : drawingMode === "circle" ? "Click the center and drag to set the radius." : shapeActive ? "Area filter active. Drag the shape or its handles to refine it." : "Choose a city, draw a boundary, or search this map area.";

  return <div className={styles.realMapShell}>
    <div ref={mapNode} className={styles.realMap} aria-label="Interactive Phoenix property map" />
    {error && <div className={styles.mapError}><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5c0 1.9-.7 3.7-1.7 5.3" /><circle cx="12" cy="9.5" r="2.5" /><line x1="3" y1="3" x2="21" y2="21" /></svg><strong>Map unavailable</strong><span>{error}</span></div>}
    <div className={styles.mapModeControl}><button type="button" className={mapType === "roadmap" ? styles.mapModeActive : ""} disabled={drawingMode !== "pan"} onClick={() => setMapType("roadmap")}>Map</button><button type="button" className={mapType === "satellite" ? styles.mapModeActive : ""} disabled={drawingMode !== "pan"} onClick={() => setMapType("satellite")}>Satellite</button></div>
    <div className={styles.shapeToolbar} aria-label="Map area drawing tools">
      <button type="button" className={drawingMode === "pan" ? styles.shapeToolActive : ""} onClick={() => { if (isDrawing.current) clearShape(); else stopDrawing(); }} disabled={!mapReady} title="Pan map"><span className={styles.handIcon}>✋</span><small>Pan</small></button>
      <button type="button" className={drawingMode === "rectangle" ? styles.shapeToolActive : ""} onClick={() => beginDragShape("rectangle")} disabled={!mapReady} title="Draw rectangle"><span className={styles.rectangleIcon} /><small>Box</small></button>
      <button type="button" className={drawingMode === "circle" ? styles.shapeToolActive : ""} onClick={() => beginDragShape("circle")} disabled={!mapReady} title="Draw radius"><span className={styles.circleIcon} /><small>Radius</small></button>
      <button type="button" className={drawingMode === "polygon" ? styles.shapeToolActive : ""} onClick={beginPolygon} disabled={!mapReady} aria-label="Draw polygon for searching" title="Draw polygon for searching"><svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4 20 8 19 20 4 20Z" fill="currentColor" fillOpacity=".25" stroke="currentColor" strokeWidth="1.6" /><circle cx="4" cy="4" r="2" fill="currentColor" /><circle cx="20" cy="8" r="2" fill="currentColor" /><circle cx="19" cy="20" r="2" fill="currentColor" /><circle cx="4" cy="20" r="2" fill="currentColor" /></svg><small>Shape</small></button>
      <button type="button" onClick={() => clearShape()} disabled={!mapReady} title="Clear drawn area"><span className={styles.clearIcon}>×</span><small>Clear</small></button>
    </div>
    <div className={styles.manualZoomControls} aria-label="Map zoom controls"><button type="button" onClick={() => map.current?.setZoom(Math.min(21, (map.current.getZoom() ?? 10) + 1))} disabled={drawingMode !== "pan"} aria-label="Zoom in">+</button><button type="button" onClick={() => map.current?.setZoom(Math.max(3, (map.current.getZoom() ?? 10) - 1))} disabled={drawingMode !== "pan"} aria-label="Zoom out">−</button></div>
    <div className={styles.pocketPrompt}><strong>{loading ? "Searching area…" : shapeActive ? `${total.toLocaleString()} properties in area` : drawingMode === "pan" ? "Draw a search area" : "Drawing area"}</strong><span>{drawingText}</span>{drawingError && <span role="alert">{drawingError}</span>}<div>{drawingMode === "polygon" && <><button type="button" onClick={() => polygonControls.current?.undo()} disabled={!drawPoints}>Undo</button><button type="button" onClick={() => polygonControls.current?.finish()} disabled={drawPoints < 3}>Finish shape</button></>}{drawingMode !== "pan" && <button type="button" onClick={() => clearShape()}>Cancel</button>}{drawingMode === "pan" && <button type="button" disabled={!mapReady || loading} onClick={searchVisibleArea}>Search this area</button>}</div></div>
    <div className={styles.mapLegend}><span><i className={styles.standardDot} />{!hasArea ? "Choose an area to show listings" : loading ? "Updating listings…" : `${pins.length.toLocaleString()} mapped · ${total.toLocaleString()} matches`}</span></div>
    {selected && hasArea && !loading && pins.some((pin) => pin.id === selected.id) && <article className={styles.mapCard}><button type="button" onClick={() => onSelect("")} aria-label="Close listing card">×</button><span>{normalizeStatus(selected.status)} · MLS #{selected.mlsNumber}</span><h2>{selected.address}</h2><p>{selected.city}, AZ {selected.zip}</p><div><strong>{money(selected.listPrice)}</strong><span>{selected.beds ?? "—"} bd · {selected.baths ?? "—"} ba · {selected.sqft?.toLocaleString() ?? "—"} sq ft</span></div><small>{selected.dwellingType} · {selected.pool === true ? "Private pool" : selected.pool === false ? "No private pool" : "Pool unknown"} · {selected.interiorLevels ?? "—"} level{selected.interiorLevels === 1 ? "" : "s"}</small></article>}
  </div>;
}
