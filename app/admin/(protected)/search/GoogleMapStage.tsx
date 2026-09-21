"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { loadGoogleMaps } from "./load-google-maps";
import type { DrawnShape, ListingRecord, Pin } from "@/lib/search/types";
import styles from "./search.module.css";

type DrawingMode = "pan" | "rectangle" | "circle" | "polygon";
type MapShape = google.maps.Polygon | google.maps.Rectangle | google.maps.Circle;

/** The map only ever draws the highest-scoring slice; the rest stay on the server. */
const MAX_MARKERS = 250;

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
}: {
  pins: Pin[];
  selected: ListingRecord | null;
  total: number;
  onSelect: (id: string) => void;
  onShapeChange: (shape: DrawnShape | null) => void;
}) {
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const activeShape = useRef<MapShape | null>(null);
  const drawingListeners = useRef<google.maps.MapsEventListener[]>([]);
  const shapeListeners = useRef<google.maps.MapsEventListener[]>([]);
  const dragStart = useRef<google.maps.LatLng | null>(null);
  const onSelectRef = useRef(onSelect);
  const onShapeChangeRef = useRef(onShapeChange);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("pan");
  const [drawPoints, setDrawPoints] = useState(0);
  const [shapeActive, setShapeActive] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onSelectRef.current = onSelect;
    onShapeChangeRef.current = onShapeChange;
  }, [onSelect, onShapeChange]);

  function removeListeners(listeners: MutableRefObject<google.maps.MapsEventListener[]>) {
    listeners.current.forEach((listener) => listener.remove());
    listeners.current = [];
  }

  function refreshShape() {
    if (!activeShape.current) return;
    setShapeActive(true);
    onShapeChangeRef.current(toDrawnShape(activeShape.current));
  }

  function clearShape(notify = true) {
    removeListeners(drawingListeners);
    removeListeners(shapeListeners);
    activeShape.current?.setMap(null);
    activeShape.current = null;
    dragStart.current = null;
    map.current?.setOptions({ draggable: true, draggableCursor: null, disableDoubleClickZoom: false });
    setDrawingMode("pan");
    setDrawPoints(0);
    setShapeActive(false);
    if (notify) onShapeChangeRef.current(null);
  }

  function makeEditable(shape: MapShape) {
    removeListeners(shapeListeners);
    shape.setEditable(true);
    shape.setDraggable(true);
    shapeListeners.current.push(shape.addListener("dragend", refreshShape));
    if (shape instanceof google.maps.Rectangle) shapeListeners.current.push(shape.addListener("bounds_changed", refreshShape));
    if (shape instanceof google.maps.Circle) {
      shapeListeners.current.push(shape.addListener("center_changed", refreshShape));
      shapeListeners.current.push(shape.addListener("radius_changed", refreshShape));
    }
    if (shape instanceof google.maps.Polygon) {
      const path = shape.getPath();
      shapeListeners.current.push(path.addListener("set_at", refreshShape), path.addListener("insert_at", refreshShape), path.addListener("remove_at", refreshShape));
    }
    refreshShape();
  }

  function stopDrawing() {
    removeListeners(drawingListeners);
    dragStart.current = null;
    map.current?.setOptions({ draggable: true, draggableCursor: null, disableDoubleClickZoom: false });
    setDrawingMode("pan");
  }

  function finishPolygon() {
    const polygon = activeShape.current;
    if (!(polygon instanceof google.maps.Polygon) || polygon.getPath().getLength() < 3) return;
    stopDrawing();
    makeEditable(polygon);
  }

  function beginPolygon() {
    if (!map.current) return;
    clearShape();
    const polygon = new google.maps.Polygon({ map: map.current, paths: [], ...shapeStyle });
    activeShape.current = polygon;
    setDrawingMode("polygon");
    map.current.setOptions({ draggableCursor: "crosshair", disableDoubleClickZoom: true });
    drawingListeners.current.push(
      map.current.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (!event.latLng || !(activeShape.current instanceof google.maps.Polygon)) return;
        activeShape.current.getPath().push(event.latLng);
        setDrawPoints(activeShape.current.getPath().getLength());
      }),
      map.current.addListener("dblclick", () => {
        finishPolygon();
      }),
    );
  }

  function beginDragShape(mode: "rectangle" | "circle") {
    if (!map.current) return;
    clearShape();
    setDrawingMode(mode);
    map.current.setOptions({ draggable: false, draggableCursor: "crosshair" });
    drawingListeners.current.push(
      map.current.addListener("mousedown", (event: google.maps.MapMouseEvent) => {
        if (!event.latLng || !map.current) return;
        dragStart.current = event.latLng;
        const start = event.latLng;
        activeShape.current = mode === "rectangle"
          ? new google.maps.Rectangle({ map: map.current, bounds: new google.maps.LatLngBounds(start, start), ...shapeStyle })
          : new google.maps.Circle({ map: map.current, center: start, radius: 1, ...shapeStyle });
      }),
      map.current.addListener("mousemove", (event: google.maps.MapMouseEvent) => {
        if (!event.latLng || !dragStart.current || !activeShape.current) return;
        if (activeShape.current instanceof google.maps.Rectangle) activeShape.current.setBounds(new google.maps.LatLngBounds(dragStart.current, event.latLng));
        if (activeShape.current instanceof google.maps.Circle) activeShape.current.setRadius(google.maps.geometry.spherical.computeDistanceBetween(dragStart.current, event.latLng));
      }),
      map.current.addListener("mouseup", () => {
        if (!activeShape.current || !dragStart.current) return;
        const shape = activeShape.current;
        stopDrawing();
        makeEditable(shape);
      }),
    );
  }

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (cancelled || !mapNode.current) return;
      map.current = new google.maps.Map(mapNode.current, {
        center: { lat: 33.4484, lng: -112.074 }, zoom: 10, mapTypeControl: false, fullscreenControl: false,
        streetViewControl: false, gestureHandling: "greedy", clickableIcons: false,
        styles: [{ featureType: "poi.business", stylers: [{ visibility: "off" }] }, { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] }, { featureType: "transit", stylers: [{ visibility: "off" }] }],
      });
      setMapReady(true);
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Google Maps could not be loaded."));
    return () => {
      cancelled = true;
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

    // Pins arrive score-ordered, so the top slice is the most interesting one.
    const visible = pins.slice(0, MAX_MARKERS);
    // A pin can be selected from a later page (or the detail view) and fall
    // outside that slice — keep it on the map so its card has an anchor.
    if (selected && !visible.some((pin) => pin.id === selected.id)) {
      const known = pins.find((pin) => pin.id === selected.id);
      if (known) visible.push(known);
      else if (selected.latitude != null && selected.longitude != null) {
        visible.push({ id: selected.id, lat: selected.latitude, lng: selected.longitude, price: selected.listPrice, status: selected.status, target: false });
      }
    }

    const bounds = new google.maps.LatLngBounds();
    visible.forEach((pin) => {
      const isSelected = pin.id === selected?.id;
      const marker = new google.maps.Marker({
        map: map.current, position: { lat: pin.lat, lng: pin.lng }, title: money(pin.price),
        zIndex: isSelected ? 30 : pin.target ? 20 : 10,
        label: { text: money(pin.price, true), color: "#ffffff", fontSize: "10px", fontWeight: "700" },
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: isSelected ? 22 : 19, fillColor: isSelected ? "#a83a27" : pin.target ? "#d06a2f" : "#167fbd", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
      });
      marker.addListener("click", () => onSelectRef.current(pin.id));
      markers.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    if (!activeShape.current && !bounds.isEmpty()) {
      map.current.fitBounds(bounds, 54);
      google.maps.event.addListenerOnce(map.current, "idle", () => { if ((map.current?.getZoom() ?? 0) > 13) map.current?.setZoom(13); });
    }
  }, [pins, mapReady, selected]);

  const drawingText = drawingMode === "polygon" ? `Click boundary points (${drawPoints}); double-click or Finish to close.` : drawingMode === "rectangle" ? "Click and drag corner-to-corner." : drawingMode === "circle" ? "Click the center and drag to set the radius." : shapeActive ? "Area filter active. Drag the shape or its handles to refine it." : "Choose a shape tool to isolate a search pocket.";

  return <div className={styles.realMapShell}>
    <div ref={mapNode} className={styles.realMap} aria-label="Interactive Phoenix property map" />
    {error && <div className={styles.mapError}><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5c0 1.9-.7 3.7-1.7 5.3" /><circle cx="12" cy="9.5" r="2.5" /><line x1="3" y1="3" x2="21" y2="21" /></svg><strong>Map unavailable</strong><span>{error}</span></div>}
    <div className={styles.mapModeControl}><button type="button" className={mapType === "roadmap" ? styles.mapModeActive : ""} onClick={() => setMapType("roadmap")}>Map</button><button type="button" className={mapType === "satellite" ? styles.mapModeActive : ""} onClick={() => setMapType("satellite")}>Satellite</button></div>
    <div className={styles.shapeToolbar} aria-label="Map area drawing tools">
      <button type="button" className={drawingMode === "pan" ? styles.shapeToolActive : ""} onClick={() => stopDrawing()} title="Pan map"><span className={styles.handIcon}>✋</span><small>Pan</small></button>
      <button type="button" className={drawingMode === "rectangle" ? styles.shapeToolActive : ""} onClick={() => beginDragShape("rectangle")} title="Draw rectangle"><span className={styles.rectangleIcon} /><small>Box</small></button>
      <button type="button" className={drawingMode === "circle" ? styles.shapeToolActive : ""} onClick={() => beginDragShape("circle")} title="Draw radius"><span className={styles.circleIcon} /><small>Radius</small></button>
      <button type="button" className={drawingMode === "polygon" ? styles.shapeToolActive : ""} onClick={beginPolygon} title="Draw polygon"><span className={styles.polygonIcon} /><small>Shape</small></button>
      <button type="button" onClick={() => clearShape()} title="Clear drawn area"><span className={styles.clearIcon}>×</span><small>Clear</small></button>
    </div>
    <div className={styles.manualZoomControls} aria-label="Map zoom controls"><button type="button" onClick={() => map.current?.setZoom(Math.min(21, (map.current.getZoom() ?? 10) + 1))} aria-label="Zoom in">+</button><button type="button" onClick={() => map.current?.setZoom(Math.max(3, (map.current.getZoom() ?? 10) - 1))} aria-label="Zoom out">−</button></div>
    <div className={styles.pocketPrompt}><strong>{shapeActive ? `${total.toLocaleString()} properties in area` : drawingMode === "pan" ? "Draw a search area" : "Drawing area"}</strong><span>{drawingText}</span><div>{drawingMode === "polygon" && <button type="button" onClick={finishPolygon} disabled={drawPoints < 3}>Finish shape</button>}</div></div>
    <div className={styles.mapLegend}><span><i className={styles.standardDot} />Listing</span><span><i className={styles.targetDot} />≤70% ARV target</span></div>
    {selected && <article className={styles.mapCard}><button type="button" onClick={() => onSelect("")} aria-label="Close listing card">×</button><span>{normalizeStatus(selected.status)} · MLS #{selected.mlsNumber}</span><h2>{selected.address}</h2><p>{selected.city}, AZ {selected.zip}</p><div><strong>{money(selected.listPrice)}</strong><span>{selected.beds ?? "—"} bd · {selected.baths ?? "—"} ba · {selected.sqft?.toLocaleString() ?? "—"} sq ft</span></div><small>{selected.dwellingType} · {selected.pool === true ? "Private pool" : selected.pool === false ? "No private pool" : "Pool unknown"} · {selected.interiorLevels ?? "—"} level{selected.interiorLevels === 1 ? "" : "s"}</small></article>}
  </div>;
}
