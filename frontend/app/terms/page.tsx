import { LegalPage } from "@/components/legal-page";
export const metadata = { title: "Terms of Use | JobTrackr" };
export default function Terms() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        JobTrackr helps you organize applications, interviews, and job-search
        activity. By using the service, you agree to use it responsibly and
        follow these terms.
      </p>
      <h2>Your account and records</h2>
      <p>
        Keep your login details private. You are responsible for the information
        you enter and for having permission to store it. You retain ownership of
        your records and allow JobTrackr to process them to provide the service.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not access another person’s account, upload unlawful content, disrupt
        the service, or attempt to bypass security controls. Access may be
        restricted to protect users and the service from abuse.
      </p>
      <h2>Availability and job-search outcomes</h2>
      <p>
        JobTrackr is provided as available. Features may change and
        interruptions may occur. Analytics describe the records you enter and do
        not guarantee interviews, offers, or employment. Keep an exported copy
        of important application records.
      </p>
      <h2>Closing your account</h2>
      <p>
        You may stop using the service at any time and delete your account
        through Settings. See the Privacy page for how your information is
        handled.
      </p>
      <h2>Questions</h2>
      <p>
        Contact{" "}
        <a className="text-link" href="mailto:cyrisjoseph@outlook.com">
          cyrisjoseph@outlook.com
        </a>{" "}
        for support or questions about these terms.
      </p>
    </LegalPage>
  );
}
