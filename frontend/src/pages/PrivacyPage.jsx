import usePageTitle from "../hooks/usePageTitle";
export default function PrivacyPage() {
  usePageTitle("Privacy Policy");
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 28px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "inline-block",
            background: "#EEEDFE",
            border: "0.5px solid #AFA9EC",
            borderRadius: "20px",
            padding: "4px 14px",
            fontSize: "12px",
            color: "#534AB7",
            fontWeight: 500,
            marginBottom: "16px",
          }}
        >
          Legal
        </div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#26215C",
            marginBottom: "8px",
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontSize: "14px", color: "#888" }}>
          Last updated: April 2026
        </p>
      </div>

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {[
          {
            title: "1. Introduction",
            content: `NepSaathi ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform at nepsaathi.com.

By using NepSaathi, you agree to the collection and use of information in accordance with this policy.`,
          },
          {
            title: "2. Information we collect",
            content: `We collect the following types of information:

- Account information — your name, email address, and password when you register
- Profile information — phone number, location, bio, and profile picture
- Listing information — details of jobs, rooms, events, announcements or businesses you post
- Google account information — if you sign in with Google, we receive your name, email and profile picture
- Usage data — how you interact with our platform, pages visited, and search queries`,
          },
          {
            title: "3. How we use your information",
            content: `We use your information to:

- Provide and improve the NepSaathi platform
- Display your listings to other community members
- Send you relevant notifications about your listings
- Verify your identity and prevent fraud
- Comply with legal obligations

We do not sell your personal information to third parties.`,
          },
          {
            title: "4. Information sharing",
            content: `We share your information only in these circumstances:

- Public listings — your listing title, description, location and contact details are visible to other users
- Contact details — phone, WhatsApp and email are only shown to logged in users
- Service providers — we use trusted third parties (Cloudinary for images, Google for authentication) who are bound by confidentiality agreements
- Legal requirements — if required by law or to protect our rights`,
          },
          {
            title: "5. Data security",
            content: `We implement industry-standard security measures to protect your data:

- All passwords are hashed and never stored in plain text
- JWT tokens expire after 60 minutes
- All data is transmitted over HTTPS
- We regularly review and update our security practices

However, no method of transmission over the internet is 100% secure.`,
          },
          {
            title: "6. Your rights",
            content: `You have the right to:

- Access your personal data at any time via your Profile settings
- Update or correct your information in Profile settings
- Delete your account by contacting support@nepsaathi.com
- Opt out of non-essential communications

For any privacy concerns, contact us at privacy@nepsaathi.com`,
          },
          {
            title: "7. Cookies",
            content: `NepSaathi uses minimal cookies and local storage to:

- Keep you logged in between sessions
- Remember your preferences

We do not use advertising cookies or tracking pixels.`,
          },
          {
            title: "8. Contact us",
            content: `If you have questions about this Privacy Policy, please contact us at:

Email: privacy@nepsaathi.com
Website: nepsaathi.com`,
          },
        ].map(({ title, content }) => (
          <div
            key={title}
            style={{
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#26215C",
                marginBottom: "12px",
              }}
            >
              {title}
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#555",
                lineHeight: 1.8,
                whiteSpace: "pre-line",
              }}
            >
              {content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
