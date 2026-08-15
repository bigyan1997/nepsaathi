import { useEffect } from "react";

const SITE_NAME = "NepSaathi";
const DEFAULT_TITLE = "NepSaathi — नेपसाथी | Jobs, Rooms & Community for Nepalese Australians";
const DEFAULT_DESC =
  "Find Nepalese community listings in Australia — jobs, rooms, events, businesses and more on NepSaathi.";
const DEFAULT_CANONICAL = "https://www.nepsaathi.com/";

function setMeta(selector, attr, value) {
  let el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

const DEFAULT_IMAGE = "https://www.nepsaathi.com/icon-512.png";

export default function usePageMeta(title, description, image) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
    const metaDesc = description
      ? description.replace(/\s+/g, " ").trim().slice(0, 155)
      : DEFAULT_DESC;
    const canonicalUrl = title
      ? window.location.origin + window.location.pathname
      : DEFAULT_CANONICAL;
    const metaImage = image || DEFAULT_IMAGE;

    const prevTitle = document.title;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    const prevOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "";
    const prevOgDesc = document.querySelector('meta[property="og:description"]')?.getAttribute("content") ?? "";
    const prevOgUrl = document.querySelector('meta[property="og:url"]')?.getAttribute("content") ?? "";
    const prevOgImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "";
    const prevTwTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ?? "";
    const prevTwDesc = document.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ?? "";
    const prevTwImage = document.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ?? "";
    const prevCanonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? DEFAULT_CANONICAL;

    document.title = fullTitle;
    setMeta('meta[name="description"]', "content", metaDesc);
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", metaDesc);
    setMeta('meta[property="og:url"]', "content", canonicalUrl);
    setMeta('meta[property="og:image"]', "content", metaImage);
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", metaDesc);
    setMeta('meta[name="twitter:image"]', "content", metaImage);
    setCanonical(canonicalUrl);

    return () => {
      document.title = prevTitle;
      setMeta('meta[name="description"]', "content", prevDesc);
      setMeta('meta[property="og:title"]', "content", prevOgTitle);
      setMeta('meta[property="og:description"]', "content", prevOgDesc);
      setMeta('meta[property="og:url"]', "content", prevOgUrl);
      setMeta('meta[property="og:image"]', "content", prevOgImage);
      setMeta('meta[name="twitter:title"]', "content", prevTwTitle);
      setMeta('meta[name="twitter:description"]', "content", prevTwDesc);
      setMeta('meta[name="twitter:image"]', "content", prevTwImage);
      setCanonical(prevCanonical);
    };
  }, [title, description, image]);
}
