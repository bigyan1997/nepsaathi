import usePageTitle from "../hooks/usePageTitle";

function Section({ title, content, even }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e5e5e5",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: even ? "#FFF1E0" : "#F5F4F0",
          borderBottom: `0.5px solid ${even ? "#EFD9C0" : "#e5e5e5"}`,
          padding: "12px 20px",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: even ? "#633806" : "#444",
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      <p
        style={{
          fontSize: "14px",
          color: "#555",
          lineHeight: 1.8,
          whiteSpace: "pre-line",
          padding: "18px 20px",
          margin: 0,
        }}
      >
        {content}
      </p>
    </div>
  );
}

export default function TermsPage() {
  usePageTitle("Terms of Use");

  const sections = [
    {
      title: "1. Acceptance of terms",
      content: `By accessing or using NepSaathi ("the platform"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our platform.\n\nNepSaathi is a community platform for the Nepalese diaspora in Australia and worldwide.`,
    },
    {
      title: "2. User accounts",
      content: `To post listings or access contact details, you must create an account. You agree to:\n\n- Provide accurate and complete information when registering\n- Keep your password secure and not share it with others\n- Notify us immediately of any unauthorised use of your account\n- Be at least 18 years old to use this platform\n- One person may only maintain one account`,
    },
    {
      title: "3. Posting rules",
      content: `When posting listings on NepSaathi, you must not:\n\n- Post false, misleading or fraudulent listings\n- Post the same listing multiple times (spam)\n- Post illegal content or illegal offers\n- Harass, threaten or abuse other users\n- Post content that discriminates based on race, religion, gender or other protected characteristics\n- Use the platform for pyramid schemes or multi-level marketing\n- Scrape or copy listings without permission\n\nViolation of these rules may result in immediate account suspension.`,
    },
    {
      title: "4. Content ownership",
      content: `You retain ownership of the content you post on NepSaathi. By posting, you grant NepSaathi a non-exclusive, worldwide licence to display your content on the platform.\n\nYou are solely responsible for the accuracy of your listings and any transactions that result from them.`,
    },
    {
      title: "5. Prohibited activities",
      content: `You must not:\n\n- Attempt to hack, disrupt or damage the platform\n- Use automated tools to scrape or mass-post listings\n- Impersonate other users or businesses\n- Use the platform for any unlawful purpose\n- Attempt to circumvent our spam or rate limiting controls`,
    },
    {
      title: "6. Disclaimer",
      content: `NepSaathi is a community platform and does not:\n\n- Verify the accuracy of listings posted by users\n- Guarantee the quality or legitimacy of any job, room or service listed\n- Take responsibility for any transactions between users\n- Endorse any business or individual listed on the platform\n\nAlways exercise your own judgement when responding to listings.`,
    },
    {
      title: "7. Limitation of liability",
      content: `To the maximum extent permitted by law, NepSaathi shall not be liable for any indirect, incidental, special or consequential damages arising from your use of the platform.\n\nOur total liability to you shall not exceed the amount you have paid us in the past 12 months (if any).`,
    },
    {
      title: "8. Termination",
      content: `We reserve the right to suspend or terminate your account at any time if you violate these terms or engage in behaviour that is harmful to the community.\n\nYou may delete your account at any time by contacting support@nepsaathi.com`,
    },
    {
      title: "9. Changes to terms",
      content: `We may update these terms from time to time. We will notify users of significant changes via email. Continued use of the platform after changes constitutes acceptance of the new terms.`,
    },
    {
      title: "10. Contact us",
      content: `For questions about these Terms of Use, contact us at:\n\nEmail: legal@nepsaathi.com\nWebsite: www.nepsaathi.com`,
    },
  ];

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "28px",
        background: "#F5F4F0",
        minHeight: "100vh",
      }}
    >
      {/* Hero */}
      <div
        style={{
          background: "#26215C",
          borderRadius: "16px",
          padding: "28px 32px",
          marginBottom: "14px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            background: "#FFF1E0",
            border: "0.5px solid #EFD9C0",
            borderRadius: "20px",
            padding: "4px 14px",
            fontSize: "11px",
            color: "#633806",
            fontWeight: 600,
            marginBottom: "14px",
            letterSpacing: "0.03em",
          }}
        >
          LEGAL
        </span>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "#fff",
            marginBottom: "6px",
          }}
        >
          Terms of Use
        </h1>
        <p style={{ fontSize: "13px", color: "#AFA9EC", margin: 0 }}>
          Last updated: April 2026
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {sections.map((s, i) => (
          <Section key={s.title} {...s} even={i % 2 === 0} />
        ))}
      </div>
    </div>
  );
}
