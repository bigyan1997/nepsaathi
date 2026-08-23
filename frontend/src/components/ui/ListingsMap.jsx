import { useEffect, useRef } from "react";
import { GlobeHemisphereEastIcon } from "@phosphor-icons/react";

// Leaflet must be imported with its CSS. We load CSS lazily via a <link> tag
// to avoid bundling it in the main chunk when the map is never opened.
function ensureLeafletCSS() {
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }
}

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export default function ListingsMap({ listings, type, onMarkerClick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const withCoords = listings.filter((l) => l.latitude && l.longitude);

  useEffect(() => {
    ensureLeafletCSS();

    import("leaflet").then((L) => {
      if (mapRef.current || !containerRef.current) return;

      // Default centre: Sydney if no listings have coords yet
      const centre =
        withCoords.length > 0
          ? [withCoords[0].latitude, withCoords[0].longitude]
          : [-33.8688, 151.2093];

      const map = L.map(containerRef.current, {
        center: centre,
        zoom: withCoords.length > 0 ? 11 : 5,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 18 }).addTo(map);

      // Accent colour by type
      const colour = type === "room" ? "#E87722" : "#534AB7";

      withCoords.forEach((listing) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${colour};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          popupAnchor: [0, -10],
        });

        const title = listing.listing_title || listing.title || "";
        const location = listing.listing_location || listing.location || "";
        const state = listing.listing_state || listing.state || "";
        const slug = listing.listing_slug || listing.slug || "";

        const popup = L.popup({ maxWidth: 220 }).setContent(`
          <div style="font-family:sans-serif;font-size:13px;">
            <div style="font-weight:700;color:#26215C;margin-bottom:4px;line-height:1.3;">${title}</div>
            <div style="color:#888;font-size:11px;margin-bottom:8px;">📍 ${location}, ${state}</div>
            <a href="/${type === "room" ? "rooms" : "jobs"}/${slug}"
               style="color:#534AB7;font-weight:700;font-size:12px;text-decoration:none;">
              View listing →
            </a>
          </div>
        `);

        const marker = L.marker([listing.latitude, listing.longitude], { icon })
          .bindPopup(popup)
          .addTo(map);

        marker.on("click", () => {
          if (onMarkerClick) onMarkerClick(listing);
        });

        markersRef.current.push(marker);
      });

      // Fit map to all markers if we have more than one
      if (withCoords.length > 1) {
        const bounds = L.latLngBounds(withCoords.map((l) => [l.latitude, l.longitude]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (withCoords.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "420px", background: "#f5f4f0", borderRadius: "16px", color: "#aaa", flexDirection: "column", gap: "10px" }}>
        <GlobeHemisphereEastIcon size={32} weight="duotone" color="#9CA3AF" />
        <div style={{ fontSize: "14px" }}>No listings with location data yet</div>
        <div style={{ fontSize: "12px" }}>New listings are geocoded automatically</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "520px", borderRadius: "16px", overflow: "hidden", border: "0.5px solid #e5e5e5" }}
    />
  );
}
