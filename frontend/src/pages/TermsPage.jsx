import usePageTitle from "../hooks/usePageTitle";
export default function TermsPage() {
  usePageTitle("Terms of Use");
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 28px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div
          style={{
            display: "inline-block",
            background: "#FFF1E0",
            border: "0.5px solid #EFD9C0",
            borderRadius: "20px",
            padding: "4px 14px",
            fontSize: "12px",
            color: "#633806",
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
          Terms of Use
        </h1>
        <p style={{ fontSize: "14px", color: "#888" }}>
          Last updated: April 2026
        </p>
      </div>

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {[
          {
            title: "1. Acceptance of terms",
            content: `By accessing or using NepSaathi ("the platform"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our platform.

NepSaathi is a community platform for the Nepalese diaspora in Australia and worldwide.`,
          },
          {
            title: "2. User accounts",
            content: `To post listings or access contact details, you must create an account. You agree to:

- Provide accurate and complete information when registering
- Keep your password secure and not share it with others
- Notify us immediately of any unauthorised use of your account
- Be at least 18 years old to use this platform
- One person may only maintain one account`,
          },
          {
            title: "3. Posting rules",
            content: `When posting listings on NepSaathi, you must not:

- Post false, misleading or fraudulent listings
- Post the same listing multiple times (spam)
- Post illegal content or illegal offers
- Harass, threaten or abuse other users
- Post content that discriminates based on race, religion, gender or other protected characteristics
- Use the platform for pyramid schemes or multi-level marketing
- Scrape or copy listings without permission

Violation of these rules may result in immediate account suspension.`,
          },
          {
            title: "4. Content ownership",
            content: `You retain ownership of the content you post on NepSaathi. By posting, you grant NepSaathi a non-exclusive, worldwide licence to display your content on the platform.

You are solely responsible for the accuracy of your listings and any transactions that result from them.`,
          },
          {
            title: "5. Prohibited activities",
            content: `You must not:

- Attempt to hack, disrupt or damage the platform
- Use automated tools to scrape or mass-post listings
- Impersonate other users or businesses
- Use the platform for any unlawful purpose
- Attempt to circumvent our spam or rate limiting controls`,
          },
          {
            title: "6. Disclaimer",
            content: `NepSaathi is a community platform and does not:

- Verify the accuracy of listings posted by users
- Guarantee the quality or legitimacy of any job, room or service listed
- Take responsibility for any transactions between users
- Endorse any business or individual listed on the platform

Always exercise your own judgement when responding to listings.`,
          },
          {
            title: "7. Limitation of liability",
            content: `To the maximum extent permitted by law, NepSaathi shall not be liable for any indirect, incidental, special or consequential damages arising from your use of the platform.

Our total liability to you shall not exceed the amount you have paid us in the past 12 months (if any).`,
          },
          {
            title: "8. Termination",
            content: `We reserve the right to suspend or terminate your account at any time if you violate these terms or engage in behaviour that is harmful to the community.

You may delete your account at any time by contacting support@nepsaathi.com`,
          },
          {
            title: "9. Changes to terms",
            content: `We may update these terms from time to time. We will notify users of significant changes via email. Continued use of the platform after changes constitutes acceptance of the new terms.`,
          },
          {
            title: "10. Contact us",
            content: `For questions about these Terms of Use, contact us at:

Email: legal@nepsaathi.com
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
