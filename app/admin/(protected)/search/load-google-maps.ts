const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

let loadPromise: Promise<void> | null = null;

// With `loading=async`, the script tag alone does not populate google.maps.Map,
// google.maps.Marker, etc. — those only become available after explicitly
// importing the relevant library. Without this, `new google.maps.Map(...)`
// throws "google.maps.Map is not a constructor" even though the script loaded.
async function importCoreLibraries(): Promise<void> {
  await Promise.all([
    google.maps.importLibrary("maps"),
    google.maps.importLibrary("geometry"),
  ]);
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
      existing.addEventListener("load", () => { importCoreLibraries().then(resolve, reject); });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }
    const script = document.createElement("script");
    script.id = "gmaps-drawing-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=geometry&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => { importCoreLibraries().then(resolve, reject); };
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
