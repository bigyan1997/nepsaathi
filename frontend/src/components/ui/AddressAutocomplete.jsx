import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

const STATE_CODE = {
  "New South Wales": "NSW",
  "Victoria": "VIC",
  "Queensland": "QLD",
  "Western Australia": "WA",
  "South Australia": "SA",
  "Tasmania": "TAS",
  "Australian Capital Territory": "ACT",
  "Northern Territory": "NT",
};

function extractAddress(addr = {}) {
  const suburb = addr.suburb || addr.town || addr.city_district || addr.city || addr.village || addr.locality || addr.municipality || "";
  const stateCode = STATE_CODE[addr.state] || "";
  const postcode = addr.postcode || "";
  return { suburb, stateCode, postcode };
}

function formatLabel(addr = {}) {
  const { suburb, stateCode, postcode } = extractAddress(addr);
  return [suburb, stateCode, postcode].filter(Boolean).join(", ");
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
        q,
        format: "json",
        addressdetails: "1",
        countrycodes: "au",
        limit: "20",
        featuretype: "settlement",
      });
      const res = await fetch(`${NOMINATIM}?${params}`, {
        headers: { "Accept-Language": "en" },
      });
      const data = await res.json();
      const filtered = data
        .filter(item => {
          const addr = item.address || {};
          return addr.suburb || addr.town || addr.city || addr.village ||
                 addr.locality || addr.municipality || addr.city_district ||
                 addr.hamlet || addr.quarter;
        })
        .slice(0, 7);
      setSuggestions(filtered);
      setOpen(filtered.length > 0);
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

  function handleSelect(item) {
    const { suburb, stateCode, postcode } = extractAddress(item.address || {});
    onChange(suburb || item.name || "");
    onSelect?.({ suburb: suburb || item.name || "", state: stateCode, postcode });
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
      {suggestions.map((item, i) => {
        const label = formatLabel(item.address || {});
        return (
          <li
            key={item.place_id}
            onMouseDown={() => handleSelect(item)}
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
            {label || item.display_name}
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
        © OpenStreetMap contributors
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
