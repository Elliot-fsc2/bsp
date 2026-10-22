export type LatLngLiteral = { lat: number; lng: number };

type LatLng = { lat: () => number; lng: () => number };

type MapMouseEvent = { latLng?: LatLng };

export type GoogleMapInstance = {
  setCenter: (center: LatLngLiteral) => void;
  setZoom: (zoom: number) => void;
  addListener: (event: string, handler: (event?: MapMouseEvent) => void) => void;
};

export type GoogleMarkerInstance = {
  setPosition: (position: LatLngLiteral) => void;
  getPosition: () => LatLng | undefined;
  addListener: (event: string, handler: () => void) => void;
};

export type GooglePlaceResult = {
  formatted_address?: string;
  name?: string;
  geometry?: { location: LatLng };
};

export type GoogleAutocompleteInstance = {
  addListener: (event: string, handler: () => void) => void;
  getPlace: () => GooglePlaceResult;
};

export type GoogleMapsApi = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: {
        center: LatLngLiteral;
        zoom: number;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
      },
    ) => GoogleMapInstance;
    Marker: new (options: { position: LatLngLiteral; map: GoogleMapInstance; draggable?: boolean }) => GoogleMarkerInstance;
    Geocoder: new () => {
      geocode: (
        request: { location: LatLngLiteral } | { address: string },
        callback: (results: { formatted_address?: string; geometry?: { location: LatLng } }[] | null, status: string) => void,
      ) => void;
    };
    places: {
      Autocomplete: new (input: HTMLInputElement, options?: { fields?: string[] }) => GoogleAutocompleteInstance;
    };
  };
};

let loaderPromise: Promise<GoogleMapsApi> | null = null;
let loaderKey = "";

export function loadGoogleMaps(apiKey: string): Promise<GoogleMapsApi> {
  const scope = window as unknown as { google?: GoogleMapsApi; __demolayMapsReady?: () => void };
  if (scope.google?.maps) return Promise.resolve(scope.google);
  if (loaderPromise && loaderKey === apiKey) return loaderPromise;

  loaderKey = apiKey;
  loaderPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    scope.__demolayMapsReady = () => {
      if (scope.google?.maps) resolve(scope.google);
      else reject(new Error("Google Maps failed to initialise."));
    };

    document.getElementById("demolay-google-maps")?.remove();
    const script = document.createElement("script");
    script.id = "demolay-google-maps";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=__demolayMapsReady`;
    script.onerror = () => reject(new Error("Could not load Google Maps."));
    document.head.appendChild(script);
  });

  return loaderPromise;
}
