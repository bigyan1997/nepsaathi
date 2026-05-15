export default function JsonLd({ data }) {
  // JSON.stringify doesn't escape </script>, so a malicious listing description
  // could break out of the script tag. Replace </ to prevent tag injection.
  const safe = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
