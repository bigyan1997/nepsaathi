import usePageTitle from "../hooks/usePageTitle";

function Section({
  title,
  content,
  accent = "#534AB7",
  accentBg = "#EEEDFE",
  accentBorder = "#AFA9EC",
}) {
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
          background: accentBg,
          borderBottom: `0.5px solid ${accentBorder}`,
          padding: "12px 20px",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: accent,
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

export default function PrivacyPage() {
  usePageTitle("Privacy Policy");

  const sections = [
    {
      title: "1. Introduction",
      content: `NepSaathi ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform at nepsaathi.com.\n\nBy using NepSaathi, you agree to the collection and use of information in accordance with this policy.`,
    },
    {
      title: "2. Information we collect",
      content: `We collect the following types of information:\n\n- Account information — your name, email address, and password when you register\n- Profile information — phone number, location, bio, and profile picture\n- Listing information — details of jobs, rooms, events, announcements or businesses you post\n- Google account information — if you sign in with Google, we receive your name, email and profile picture\n- Usage data — how you interact with our platform, pages visited, and search queries`,
    },
    {
      title: "3. How we use your information",
      content: `We use your information to:\n\n- Provide and improve the NepSaathi platform\n- Display your listings to other community members\n- Send you relevant notifications about your listings\n- Verify your identity and prevent fraud\n- Comply with legal obligations\n\nWe do not sell your personal information to third parties.`,
    },
    {
      title: "4. Information sharing",
      content: `We share your information only in these circumstances:\n\n- Public listings — your listing title, description, location and contact details are visible to other users\n- Contact details — phone, WhatsApp and email are only shown to logged in users\n- Service providers — we use trusted third parties (Cloudinary for images, Google for authentication) who are bound by confidentiality agreements\n- Legal requirements — if required by law or to protect our rights`,
    },
    {
      title: "5. Data security",
      content: `We implement industry-standard security measures to protect your data:\n\n- All passwords are hashed and never stored in plain text\n- JWT tokens expire after 60 minutes\n- All data is transmitted over HTTPS\n- We regularly review and update our security practices\n\nHowever, no method of transmission over the internet is 100% secure.`,
    },
    {
      title: "6. Your rights",
      content: `You have the right to:\n\n- Access your personal data at any time via your Profile settings\n- Update or correct your information in Profile settings\n- Delete your account by contacting support@nepsaathi.com\n- Opt out of non-essential communications\n\nFor any privacy concerns, contact us at privacy@nepsaathi.com`,
    },
    {
      title: "7. Cookies",
      content: `NepSaathi uses minimal cookies and local storage to:\n\n- Keep you logged in between sessions\n- Remember your preferences\n\nWe do not use advertising cookies or tracking pixels.`,
    },
    {
      title: "8. Contact us",
      content: `If you have questions about this Privacy Policy, please contact us at:\n\nEmail: privacy@nepsaathi.com\nWebsite: nepsaathi.com`,
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
            background: "#EEEDFE",
            border: "0.5px solid #AFA9EC",
            borderRadius: "20px",
            padding: "4px 14px",
            fontSize: "11px",
            color: "#3C3489",
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: "13px", color: "#AFA9EC", margin: 0 }}>
          Last updated: April 2026
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {sections.map((s, i) => (
          <Section
            key={s.title}
            {...s}
            accentBg={i % 2 === 0 ? "#EEEDFE" : "#F5F4F0"}
            accentBorder={i % 2 === 0 ? "#AFA9EC" : "#e5e5e5"}
            accent={i % 2 === 0 ? "#3C3489" : "#444"}
          />
        ))}
      </div>
    </div>
  );
}
