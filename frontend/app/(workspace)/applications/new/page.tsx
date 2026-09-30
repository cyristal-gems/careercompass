import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApplicationForm } from "@/components/application-form";
export default function Page() {
  return (
    <div className="narrow">
      <Link href="/applications" className="back-link">
        <ArrowLeft size={16} />
        All applications
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A NEW POSSIBILITY</div>
          <h1>Add an application</h1>
          <p>One place for everything about your next opportunity.</p>
        </div>
      </div>
      <section className="panel padded">
        <ApplicationForm />
      </section>
    </div>
  );
}
