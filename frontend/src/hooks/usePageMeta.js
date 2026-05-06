import { useEffect } from "react";

const SITE_NAME = "NepSaathi";
const DEFAULT_TITLE = "NepSaathi — नेपसाथी | Jobs, Rooms & Community for Nepalese Australians";
const DEFAULT_DESC =
  "Find Nepalese community listings in Australia — jobs, rooms, events, businesses and more on NepSaathi.";

function setMeta(selector, attr, value) {
  let el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export default function usePageMeta(title, description) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
    const metaDesc = description
      ? description.replace(/\s+/g, " ").trim().slice(0, 155)
      : DEFAULT_DESC;

    const prevTitle = document.title;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    const prevOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "";
    const prevOgDesc = document.querySelector('meta[property="og:description"]')?.getAttribute("content") ?? "";
    const prevOgUrl = document.querySelector('meta[property="og:url"]')?.getAttribute("content") ?? "";
    const prevTwTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ?? "";
    const prevTwDesc = document.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ?? "";

    document.title = fullTitle;
    setMeta('meta[name="description"]', "content", metaDesc);
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", metaDesc);
    setMeta('meta[property="og:url"]', "content", window.location.href);
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", metaDesc);

    return () => {
      document.title = prevTitle;
      setMeta('meta[name="description"]', "content", prevDesc);
      setMeta('meta[property="og:title"]', "content", prevOgTitle);
      setMeta('meta[property="og:description"]', "content", prevOgDesc);
      setMeta('meta[property="og:url"]', "content", prevOgUrl);
      setMeta('meta[name="twitter:title"]', "content", prevTwTitle);
      setMeta('meta[name="twitter:description"]', "content", prevTwDesc);
    };
  }, [title, description]);
}
