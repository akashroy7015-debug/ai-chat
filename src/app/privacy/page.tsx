import { LegalPage, OPERATOR, SUPPORT_EMAIL } from "../legal";

export const dynamic = "force-dynamic";

export const metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>{OPERATOR} is the data fiduciary (India DPDP Act 2023) and controller (GDPR) for your data.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account:</b> email and a salted password hash.</li>
        <li><b>Age verification:</b> only the result (verified or not), a provider reference and the document&apos;s country. Your ID images and ID number are held by the verification provider, not by us. We never store Aadhaar numbers.</li>
        <li><b>Usage:</b> your characters, chat messages, generated media, facts your characters remember about you, token history, and safety logs.</li>
        <li><b>Technical:</b> approximate country from your connection, used to apply local-law restrictions.</li>
      </ul>
      <h2>Why</h2>
      <p>To provide the service, verify age, prevent abuse, meet legal obligations and process payments. Chats are processed by our AI model provider to generate replies. We do not sell your data.</p>
      <h2>Your rights</h2>
      <p>You can request access, correction or deletion of your data, and withdraw consent, by emailing {SUPPORT_EMAIL}. Safety and legal records may be kept where the law requires.</p>
      <h2>Retention</h2>
      <p>Account data is kept while your account is open and deleted on request. Safety logs are kept as long as needed for legal compliance.</p>
      <h2>Grievances</h2>
      <p>See the <a href="/grievance">Grievance page</a>.</p>
    </LegalPage>
  );
}
