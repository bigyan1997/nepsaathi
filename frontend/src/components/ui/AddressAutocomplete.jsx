import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

function parseFeature(feature) {
  const context = feature.context || [];
  const regionCtx = context.find(c => c.id.startsWith("region"));
  const postcodeCtx = context.find(c => c.id.startsWith("postcode"));
  const placeCtx = context.find(c => c.id.startsWith("place") || c.id.startsWith("locality"));
  const stateCode = regionCtx?.short_code?.replace("AU-", "") || "";
  // if the feature itself is a postcode result, pull suburb from context
  const isPostcode = feature.id?.startsWith("postcode");
  const suburb = isPostcode ? (placeCtx?.text || feature.text || "") : (feature.text || "");
  const postcode = isPostcode ? feature.text : (postcodeCtx?.text || "");
  return { suburb, stateCode, postcode };
}

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, inputStyle = {} }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open || !inputRef.current) return;
    function updatePos() {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  async function fetchSuggestions(q) {
    if (!q || q.length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        country: "AU",
        types: "place,locality,neighborhood,district,postcode",
        limit: "7",
        language: "en",
      });
      const res = await fetch(`${MAPBOX_URL}/${encodeURIComponent(q)}.json?${params}`);
      const data = await res.json();
      const features = data.features || [];
      setSuggestions(features);
      setOpen(features.length > 0);
      setActiveIdx(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const val = e.target.value;
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  }

  function handleSelect(feature) {
    const { suburb, stateCode, postcode } = parseFeature(feature);
    onChange(suburb);
    onSelect?.({ suburb, state: stateCode, postcode });
    setSuggestions([]);
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const dropdown = open && suggestions.length > 0 && createPortal(
    <ul style={{
      position: "absolute",
      top: dropdownPos.top,
      left: dropdownPos.left,
      width: dropdownPos.width,
      background: "#fff",
      border: "1px solid #e0e0e0",
      borderRadius: 8,
      zIndex: 99999,
      listStyle: "none",
      margin: 0,
      padding: "4px 0",
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      maxHeight: 240,
      overflowY: "auto",
    }}>
      {suggestions.map((feature, i) => {
        const { suburb, stateCode, postcode } = parseFeature(feature);
        const label = [suburb, stateCode, postcode].filter(Boolean).join(", ");
        return (
          <li
            key={feature.id}
            onMouseDown={() => handleSelect(feature)}
            onMouseEnter={() => setActiveIdx(i)}
            style={{
              padding: "9px 14px",
              cursor: "pointer",
              fontSize: 13,
              color: "#26215C",
              background: activeIdx === i ? "#f0effe" : "transparent",
              borderBottom: i < suggestions.length - 1 ? "1px solid #f5f5f5" : "none",
              lineHeight: 1.3,
            }}
          >
            {label || feature.place_name}
          </li>
        );
      })}
      <li style={{
        padding: "4px 14px 5px",
        fontSize: 10,
        color: "#bbb",
        textAlign: "right",
        borderTop: "1px solid #f0f0f0",
        listStyle: "none",
      }}>
        © Mapbox © OpenStreetMap
      </li>
    </ul>,
    document.body
  );

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder || "e.g. Parramatta"}
          autoComplete="off"
          style={inputStyle}
        />
        {loading && (
          <span style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 11,
            color: "#aaa",
            pointerEvents: "none",
          }}>
            searching...
          </span>
        )}
      </div>
      {dropdown}
    </div>
  );
}
