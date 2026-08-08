"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "./load-google-maps";
import type { ListingRecord } from "./MlsSearchWorkspace";
import styles from "./search.module.css";

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

export default function GoogleMapStage({
  listings,
  selected,
  targetIds,
  onSelect,
  onPocketChange,
}: {
  listings: ListingRecord[];
  selected: ListingRecord | null;
  targetIds: Set<string>;
  onSelect: (id: string) => void;
  onPocketChange: (ids: string[] | null) => void;
}) {
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const activeShape = useRef<google.maps.Polygon | null>(null);
  const mapClickListener = useRef<google.maps.MapsEventListener | null>(null);
  const listingsRef = useRef(listings);
  const onSelectRef = useRef(onSelect);
  const onPocketChangeRef = useRef(onPocketChange);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [pocketActive, setPocketActive] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    listingsRef.current = listings;
    onSelectRef.current = onSelect;
    onPocketChangeRef.current = onPocketChange;
  }, [listings, onSelect, onPocketChange]);

  function listingsInside(shape: google.maps.Polygon) {
    return listingsRef.current.filter((listing) => {
      if (!validCoordinates(listing)) return false;
      const point = new google.maps.LatLng(listing.latitude!, listing.longitude!);
      return google.maps.geometry.poly.containsLocation(point, shape);
    }).map((listing) => listing.id);
  }

  function clearPocket() {
    activeShape.current?.setMap(null);
    activeShape.current = null;
    mapClickListener.current?.remove();
    mapClickListener.current = null;
    map.current?.setOptions({ draggableCursor: null });
    setPocketActive(false);
    setDrawing(false);
    setDrawPoints(0);
    onPocketChangeRef.current(null);
  }

  function beginPocket() {
    if (!map.current) return;
    clearPocket();
    const polygon = new google.maps.Polygon({
      map: map.current,
      paths: [],
      fillColor: "#d06a2f",
      fillOpacity: 0.13,
      strokeColor: "#b45124",
      strokeWeight: 2,
    });
    activeShape.current = polygon;
    map.current.setOptions({ draggableCursor: "crosshair" });
    setDrawing(true);
    mapClickListener.current = map.current.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (!event.latLng || !activeShape.current) return;
      activeShape.current.getPath().push(event.latLng);
      setDrawPoints(activeShape.current.getPath().getLength());
    });
  }

  function finishPocket() {
    if (!activeShape.current || activeShape.current.getPath().getLength() < 3) return;
    mapClickListener.current?.remove();
    mapClickListener.current = null;
    map.current?.setOptions({ draggableCursor: null });
    activeShape.current.setEditable(true);
    const refreshPocket = () => {
      if (activeShape.current) onPocketChangeRef.current(listingsInside(activeShape.current));
    };
    const path = activeShape.current.getPath();
    google.maps.event.addListener(path, "set_at", refreshPocket);
    google.maps.event.addListener(path, "insert_at", refreshPocket);
    google.maps.event.addListener(path, "remove_at", refreshPocket);
    refreshPocket();
    setDrawing(false);
    setPocketActive(true);
  }

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (cancelled || !mapNode.current) return;
      map.current = new google.maps.Map(mapNode.current, {
        center: { lat: 33.4484, lng: -112.074 },
        zoom: 10,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        gestureHandling: "greedy",
        clickableIcons: false,
        styles: [
          { featureType: "poi.business", stylers: [{ visibility: "off" }] },
          { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
      });

      setMapReady(true);
    }).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : "Google Maps could not be loaded.");
    });

    return () => {
      cancelled = true;
      mapClickListener.current?.remove();
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
    const bounds = new google.maps.LatLngBounds();

    listings.filter(validCoordinates).slice(0, 250).forEach((listing) => {
      const isSelected = listing.id === selected?.id;
      const isTarget = targetIds.has(listing.id);
      const marker = new google.maps.Marker({
        map: map.current,
        position: { lat: listing.latitude!, lng: listing.longitude! },
        title: `${listing.address} · ${money(listing.listPrice)}`,
        zIndex: isSelected ? 30 : isTarget ? 20 : 10,
        label: { text: money(listing.listPrice, true), color: "#ffffff", fontSize: "10px", fontWeight: "700" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 22 : 19,
          fillColor: isSelected ? "#a83a27" : isTarget ? "#d06a2f" : "#167fbd",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => onSelectRef.current(listing.id));
      markers.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    if (!activeShape.current && !bounds.isEmpty()) {
      map.current.fitBounds(bounds, 54);
      google.maps.event.addListenerOnce(map.current, "idle", () => {
        if ((map.current?.getZoom() ?? 0) > 13) map.current?.setZoom(13);
      });
    }
    if (activeShape.current && pocketActive) {
      onPocketChangeRef.current(listingsInside(activeShape.current));
    }
  }, [listings, mapReady, pocketActive, selected?.id, targetIds]);

  return (
    <div className={styles.realMapShell}>
      <div ref={mapNode} className={styles.realMap} aria-label="Interactive Phoenix property map" />
      {error && <div className={styles.mapError}><strong>Map unavailable</strong><span>{error}</span></div>}
      <div className={styles.mapModeControl}>
        <button type="button" className={mapType === "roadmap" ? styles.mapModeActive : ""} onClick={() => setMapType("roadmap")}>Map</button>
        <button type="button" className={mapType === "satellite" ? styles.mapModeActive : ""} onClick={() => setMapType("satellite")}>Satellite</button>
      </div>
      <div className={styles.pocketPrompt}>
        <strong>{drawing ? `Plot pocket · ${drawPoints} points` : pocketActive ? "Pocket is active" : "Draw a buyer pocket"}</strong>
        <span>{drawing ? "Click at least 3 boundary points, then finish the pocket." : pocketActive ? "Deal rankings now use this map area." : "Outline a target neighborhood to focus the deal engine."}</span>
        <div>{drawing ? <><button type="button" onClick={finishPocket} disabled={drawPoints < 3}>Finish pocket</button><button type="button" onClick={clearPocket}>Cancel</button></> : pocketActive ? <button type="button" onClick={clearPocket}>Clear pocket</button> : <button type="button" onClick={beginPocket}>Start drawing</button>}</div>
      </div>
      <div className={styles.mapLegend}><span><i className={styles.standardDot} />Listing</span><span><i className={styles.targetDot} />≤70% ARV target</span></div>
      {selected && <article className={styles.mapCard}><button type="button" onClick={() => onSelect("")} aria-label="Close listing card">×</button><span>{normalizeStatus(selected.status)} · MLS #{selected.mlsNumber}</span><h2>{selected.address}</h2><p>{selected.city}, AZ {selected.zip}</p><div><strong>{money(selected.listPrice)}</strong><span>{selected.beds ?? "—"} bd · {selected.baths ?? "—"} ba · {selected.sqft?.toLocaleString() ?? "—"} sq ft</span></div><small>{selected.dwellingType} · {selected.pool === true ? "Private pool" : selected.pool === false ? "No private pool" : "Pool unknown"} · {selected.interiorLevels ?? "—"} level{selected.interiorLevels === 1 ? "" : "s"}</small></article>}
    </div>
  );
}
