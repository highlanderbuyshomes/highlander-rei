const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

let loadPromise: Promise<void> | null = null;

// With `loading=async`, the script tag alone does not populate google.maps.Map,
// google.maps.Marker, etc. — those only become available after explicitly
// importing the relevant library. Without this, `new google.maps.Map(...)`
// throws "google.maps.Map is not a constructor" even though the script loaded.
//
// The script's own `onload` fires before `google.maps.importLibrary` exists
// ("importLibrary is not a function"), so a new load waits for Google's
// `callback=` hook instead, and an already-present script is polled.
async function importCoreLibraries(): Promise<void> {
  await Promise.all([
    google.maps.importLibrary("maps"),
    google.maps.importLibrary("geometry"),
  ]);
}

function waitForImportLibrary(timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (typeof window.google?.maps?.importLibrary === "function") resolve();
      else if (Date.now() - started > timeoutMs) reject(new Error("Google Maps loaded but importLibrary never became available"));
      else setTimeout(tick, 50);
    };
    tick();
  });
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("loadGoogleMaps called on the server"));
  if (window.google?.maps?.Map && window.google?.maps?.geometry) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!GMAPS_KEY) {
      reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
      return;
    }
    const existing = document.getElementById("gmaps-drawing-script");
    if (existing) {
      waitForImportLibrary().then(importCoreLibraries).then(resolve, reject);
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }
    const script = document.createElement("script");
    script.id = "gmaps-drawing-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=geometry&loading=async&callback=__gmapsLoaded`;
    script.async = true;
    script.defer = true;
    (window as unknown as Record<string, () => void>).__gmapsLoaded = () => { importCoreLibraries().then(resolve, reject); };
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
