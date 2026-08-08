"use client";

import { useEffect, useRef, useState, useTransition, type MutableRefObject } from "react";
import { saveAreaShape } from "./actions";
import { loadGoogleMaps } from "./load-google-maps";
import type { DrawnShape, ListingRecord, SavedSearchRecord } from "./MlsSearchWorkspace";
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

function validCoordinates(listing: ListingRecord) {
  return listing.latitude != null && listing.longitude != null;
}

const shapeStyle = {
  fillColor: "#1685d2",
  fillOpacity: 0.14,
  strokeColor: "#0b6ead",
  strokeOpacity: 1,
  strokeWeight: 2,
};

export default function GoogleMapStage({
  listings,
  selected,
  targetIds,
  onSelect,
  onPocketChange,
  activeBuyer,
}: {
  listings: ListingRecord[];
  selected: ListingRecord | null;
  targetIds: Set<string>;
  onSelect: (id: string) => void;
  onPocketChange: (ids: string[] | null) => void;
  activeBuyer: SavedSearchRecord | null;
}) {
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const activeShape = useRef<MapShape | null>(null);
  const drawingListeners = useRef<google.maps.MapsEventListener[]>([]);
  const shapeListeners = useRef<google.maps.MapsEventListener[]>([]);
  const dragStart = useRef<google.maps.LatLng | null>(null);
  const listingsRef = useRef(listings);
  const onSelectRef = useRef(onSelect);
  const onPocketChangeRef = useRef(onPocketChange);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("pan");
  const [drawPoints, setDrawPoints] = useState(0);
  const [shapeData, setShapeData] = useState<DrawnShape | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    listingsRef.current = listings;
    onSelectRef.current = onSelect;
    onPocketChangeRef.current = onPocketChange;
  }, [listings, onSelect, onPocketChange]);

  function removeListeners(listeners: MutableRefObject<google.maps.MapsEventListener[]>) {
    listeners.current.forEach((listener) => listener.remove());
    listeners.current = [];
  }

  function shapeToData(shape: MapShape): DrawnShape {
    if (shape instanceof google.maps.Rectangle) {
      const bounds = shape.getBounds()!;
      return { type: "rectangle", bounds: { north: bounds.getNorthEast().lat(), east: bounds.getNorthEast().lng(), south: bounds.getSouthWest().lat(), west: bounds.getSouthWest().lng() } };
    }
    if (shape instanceof google.maps.Circle) {
      const center = shape.getCenter()!;
      return { type: "circle", center: { lat: center.lat(), lng: center.lng() }, radiusMeters: shape.getRadius() };
    }
    return { type: "polygon", path: shape.getPath().getArray().map((point) => ({ lat: point.lat(), lng: point.lng() })) };
  }

  function listingsInside(shape: MapShape) {
    return listingsRef.current.filter((listing) => {
      if (!validCoordinates(listing)) return false;
      const point = new google.maps.LatLng(listing.latitude!, listing.longitude!);
      if (shape instanceof google.maps.Rectangle) return shape.getBounds()?.contains(point) ?? false;
      if (shape instanceof google.maps.Circle) return google.maps.geometry.spherical.computeDistanceBetween(point, shape.getCenter()!) <= shape.getRadius();
      return google.maps.geometry.poly.containsLocation(point, shape);
    }).map((listing) => listing.id);
  }

  function refreshShape() {
    if (!activeShape.current) return;
    const nextShape = shapeToData(activeShape.current);
    setShapeData(nextShape);
    setSaveMessage("");
    onPocketChangeRef.current(listingsInside(activeShape.current));
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
    setShapeData(null);
    setSaveMessage("");
    if (notify) onPocketChangeRef.current(null);
  }

  function fitShape(shape: MapShape) {
    if (!map.current) return;
    const bounds = new google.maps.LatLngBounds();
    if (shape instanceof google.maps.Polygon) shape.getPath().forEach((point) => bounds.extend(point));
    else {
      const shapeBounds = shape.getBounds();
      if (shapeBounds) bounds.union(shapeBounds);
    }
    if (!bounds.isEmpty()) map.current.fitBounds(bounds, 56);
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

  function renderSavedShape(shape: DrawnShape) {
    if (!map.current) return;
    const overlay: MapShape = shape.type === "rectangle"
      ? new google.maps.Rectangle({ map: map.current, bounds: shape.bounds, ...shapeStyle })
      : shape.type === "circle"
        ? new google.maps.Circle({ map: map.current, center: shape.center, radius: shape.radiusMeters, ...shapeStyle })
        : shape.type === "marker"
          ? new google.maps.Circle({ map: map.current, center: shape.position, radius: shape.radiusMeters || 800, ...shapeStyle })
        : new google.maps.Polygon({ map: map.current, paths: shape.path, ...shapeStyle });
    activeShape.current = overlay;
    makeEditable(overlay);
    fitShape(overlay);
  }

  function saveToBuyer() {
    if (!activeBuyer || !shapeData) return;
    startSaving(async () => {
      try {
        await saveAreaShape(activeBuyer.id, shapeData);
        setSaveMessage(`Saved to ${activeBuyer.name}`);
      } catch {
        setSaveMessage("Area could not be saved");
      }
    });
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
    clearShape(false);
    if (activeBuyer?.polygon) renderSavedShape(activeBuyer.polygon);
    else onPocketChangeRef.current(null);
  // The buyer id is the intentional reset boundary; polygon updates are hydrated after a buyer switch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBuyer?.id, mapReady]);

  useEffect(() => {
    if (!map.current || !mapReady) return;
    markers.current.forEach((marker) => marker.setMap(null));
    markers.current = [];
    const bounds = new google.maps.LatLngBounds();
    listings.filter(validCoordinates).slice(0, 250).forEach((listing) => {
      const isSelected = listing.id === selected?.id;
      const isTarget = targetIds.has(listing.id);
      const marker = new google.maps.Marker({
        map: map.current, position: { lat: listing.latitude!, lng: listing.longitude! }, title: `${listing.address} · ${money(listing.listPrice)}`,
        zIndex: isSelected ? 30 : isTarget ? 20 : 10,
        label: { text: money(listing.listPrice, true), color: "#ffffff", fontSize: "10px", fontWeight: "700" },
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: isSelected ? 22 : 19, fillColor: isSelected ? "#a83a27" : isTarget ? "#d06a2f" : "#167fbd", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
      });
      marker.addListener("click", () => onSelectRef.current(listing.id));
      markers.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });
    if (!activeShape.current && !bounds.isEmpty()) {
      map.current.fitBounds(bounds, 54);
      google.maps.event.addListenerOnce(map.current, "idle", () => { if ((map.current?.getZoom() ?? 0) > 13) map.current?.setZoom(13); });
    }
    if (activeShape.current) onPocketChangeRef.current(listingsInside(activeShape.current));
  }, [listings, mapReady, selected?.id, targetIds]);

  const drawingText = drawingMode === "polygon" ? `Click boundary points (${drawPoints}); double-click or Finish to close.` : drawingMode === "rectangle" ? "Click and drag corner-to-corner." : drawingMode === "circle" ? "Click the center and drag to set the radius." : shapeData ? "Area filter active. Drag the shape or its handles to refine it." : "Choose a shape tool to isolate a buyer pocket.";

  return <div className={styles.realMapShell}>
    <div ref={mapNode} className={styles.realMap} aria-label="Interactive Phoenix property map" />
    {error && <div className={styles.mapError}><strong>Map unavailable</strong><span>{error}</span></div>}
    <div className={styles.mapModeControl}><button type="button" className={mapType === "roadmap" ? styles.mapModeActive : ""} onClick={() => setMapType("roadmap")}>Map</button><button type="button" className={mapType === "satellite" ? styles.mapModeActive : ""} onClick={() => setMapType("satellite")}>Satellite</button></div>
    <div className={styles.shapeToolbar} aria-label="Map area drawing tools">
      <button type="button" className={drawingMode === "pan" ? styles.shapeToolActive : ""} onClick={() => stopDrawing()} title="Pan map"><span className={styles.handIcon}>✋</span><small>Pan</small></button>
      <button type="button" className={drawingMode === "rectangle" ? styles.shapeToolActive : ""} onClick={() => beginDragShape("rectangle")} title="Draw rectangle"><span className={styles.rectangleIcon} /><small>Box</small></button>
      <button type="button" className={drawingMode === "circle" ? styles.shapeToolActive : ""} onClick={() => beginDragShape("circle")} title="Draw radius"><span className={styles.circleIcon} /><small>Radius</small></button>
      <button type="button" className={drawingMode === "polygon" ? styles.shapeToolActive : ""} onClick={beginPolygon} title="Draw polygon"><span className={styles.polygonIcon} /><small>Shape</small></button>
      <button type="button" onClick={() => clearShape()} title="Clear drawn area"><span className={styles.clearIcon}>×</span><small>Clear</small></button>
    </div>
    <div className={styles.manualZoomControls} aria-label="Map zoom controls"><button type="button" onClick={() => map.current?.setZoom(Math.min(21, (map.current.getZoom() ?? 10) + 1))} aria-label="Zoom in">+</button><button type="button" onClick={() => map.current?.setZoom(Math.max(3, (map.current.getZoom() ?? 10) - 1))} aria-label="Zoom out">−</button></div>
    <div className={styles.pocketPrompt}><strong>{shapeData ? `${listingsInside(activeShape.current!).length} properties in area` : drawingMode === "pan" ? "Draw a buyer search area" : "Drawing area"}</strong><span>{drawingText}</span><div>{drawingMode === "polygon" && <button type="button" onClick={finishPolygon} disabled={drawPoints < 3}>Finish shape</button>}{shapeData && activeBuyer && <button type="button" onClick={saveToBuyer} disabled={isSaving}>{isSaving ? "Saving…" : `Save to ${activeBuyer.name}`}</button>}{saveMessage && <em>{saveMessage}</em>}</div></div>
    <div className={styles.mapLegend}><span><i className={styles.standardDot} />Listing</span><span><i className={styles.targetDot} />≤70% ARV target</span></div>
    {selected && <article className={styles.mapCard}><button type="button" onClick={() => onSelect("")} aria-label="Close listing card">×</button><span>{normalizeStatus(selected.status)} · MLS #{selected.mlsNumber}</span><h2>{selected.address}</h2><p>{selected.city}, AZ {selected.zip}</p><div><strong>{money(selected.listPrice)}</strong><span>{selected.beds ?? "—"} bd · {selected.baths ?? "—"} ba · {selected.sqft?.toLocaleString() ?? "—"} sq ft</span></div><small>{selected.dwellingType} · {selected.pool === true ? "Private pool" : selected.pool === false ? "No private pool" : "Pool unknown"} · {selected.interiorLevels ?? "—"} level{selected.interiorLevels === 1 ? "" : "s"}</small></article>}
  </div>;
}
