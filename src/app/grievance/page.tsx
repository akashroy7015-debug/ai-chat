import { GRIEVANCE_OFFICER } from "@/lib/jurisdiction";

export const dynamic = "force-dynamic";
import { LegalPage } from "../legal";

export const metadata = { title: "Grievance Redressal" };

export default function Grievance() {
  return (
    <LegalPage title="Grievance Redressal">
      <p>Under India&apos;s Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, you can raise a complaint with our Grievance Officer.</p>
      <p><b>Grievance Officer:</b> {GRIEVANCE_OFFICER.name}<br /><b>Email:</b> {GRIEVANCE_OFFICER.email}</p>
      <ul>
        <li>We acknowledge complaints within {GRIEVANCE_OFFICER.ackHours} hours and resolve them within {GRIEVANCE_OFFICER.resolveDays} days.</li>
        <li>Complaints about intimate or impersonating imagery are acted on within {GRIEVANCE_OFFICER.nciiRemovalHours} hours.</li>
        <li>You can also use the &quot;Report&quot; button on any item in the app. Reported items are hidden immediately.</li>
      </ul>
      <p>Please include your account email, what the content is, and why you are reporting it.</p>
    </LegalPage>
  );
}
