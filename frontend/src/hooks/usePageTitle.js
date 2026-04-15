import { useEffect } from "react";

export default function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title
      ? `${title} — NepSaathi`
      : "NepSaathi — नेपसाथी | Jobs, Rooms & Community for Nepalese Australians";
    return () => {
      document.title = prev;
    };
  }, [title]);
}
