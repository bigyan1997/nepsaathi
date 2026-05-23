import { Helmet } from "react-helmet-async";

const SITE_NAME = "NepSaathi";
const DEFAULT_DESCRIPTION = "NepSaathi — the community marketplace for Nepalese Australians. Find jobs, rooms, events, businesses and connect with your community.";
const DEFAULT_IMAGE = "https://www.nepsaathi.com/icon-512.png";
const SITE_URL = "https://www.nepsaathi.com";

export default function SEO({ title, description, image, url, type = "website", noindex = false }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const metaDesc = description || DEFAULT_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;
  const canonical = url ? `${SITE_URL}${url}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:type" content={type} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
}
