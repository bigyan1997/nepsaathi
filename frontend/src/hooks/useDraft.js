import { useState, useEffect } from "react";

const DRAFT_KEY = "nepsaathi_post_draft";

export function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
  window.dispatchEvent(new CustomEvent("draft-changed"));
}

export function saveDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
  } catch {}
  window.dispatchEvent(new CustomEvent("draft-changed"));
}

export function readDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
}

export function useDraft() {
  const [hasDraft, setHasDraft] = useState(() => {
    try { return !!localStorage.getItem(DRAFT_KEY); } catch { return false; }
  });

  useEffect(() => {
    const sync = () => {
      try { setHasDraft(!!localStorage.getItem(DRAFT_KEY)); } catch { setHasDraft(false); }
    };
    window.addEventListener("storage", sync);
    window.addEventListener("draft-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("draft-changed", sync);
    };
  }, []);

  return hasDraft;
}
