import { LegalPage } from "@/components/legal-page";
export const metadata = { title: "Privacy | JobTrackr" };
export default function Privacy() {
  return (
    <LegalPage title="Privacy">
      <p>
        JobTrackr stores information you provide to organize your private job
        search: your name, email address, securely hashed password,
        applications, salary details, notes, contacts, interviews, follow-up
        dates, and status history.
      </p>
      <h2>How information is used</h2>
      <p>
        Your information is used to operate your account, display your records,
        calculate your job-search analytics, and send password-reset emails when
        requested. Session cookies keep you signed in. Security records help
        limit abusive login and reset attempts.
      </p>
      <h2>Sharing and service providers</h2>
      <p>
        JobTrackr does not sell your job-search data or publish your records to
        other users. Hosting, database, and email providers process information
        as needed to operate the service. Information may also be disclosed when
        required by law.
      </p>
      <h2>Your choices and deletion</h2>
      <p>
        You can edit or delete individual records and export your applications
        from Settings. Delete account in Settings permanently removes your
        account and associated records from the active database and ends your
        sessions. Infrastructure providers may retain limited logs or backups
        under their own retention practices; deletion from the active database
        does not guarantee immediate removal from those copies.
      </p>
      <h2>Security</h2>
      <p>
        Access is restricted to your account, passwords are hashed, and sessions
        expire. No online service can guarantee absolute security. Avoid
        including sensitive information that is unnecessary for your job search,
        and only add contact details you are authorized to store.
      </p>
      <h2>Contact</h2>
      <p>
        For privacy questions or help with your data, email{" "}
        <a className="text-link" href="mailto:cyrisjoseph@outlook.com">
          cyrisjoseph@outlook.com
        </a>
        .
      </p>
    </LegalPage>
  );
}
