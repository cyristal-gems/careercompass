export const statuses = [
  "saved",
  "applied",
  "screening",
  "interview",
  "assessment",
  "final_interview",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
  "ghosted",
] as const;
export const sources = [
  "LinkedIn",
  "Indeed",
  "Handshake",
  "Company Website",
  "Recruiter",
  "Referral",
  "Career Fair",
  "Glassdoor",
  "Other",
];
export const interviewTypes = [
  "recruiter_call",
  "phone_screen",
  "technical",
  "behavioral",
  "hiring_manager",
  "panel",
  "final",
];
export interface User {
  id: string;
  email: string;
  first_name: string;
}
export interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
  applied_date: string;
  location: string | null;
  work_type: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  source: string | null;
  company_website: string | null;
  priority: boolean;
  is_archived: boolean;
  job_url: string | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface Interview {
  id: string;
  application_id: string;
  status: "upcoming" | "completed" | "cancelled" | "rescheduled";
  preparation_notes: string | null;
  questions_to_ask: string | null;
  outcome_notes: string | null;
  interview_type: string;
  scheduled_at: string;
  location: string | null;
  meeting_url: string | null;
  interviewer_name: string | null;
  interviewer_email: string | null;
  notes: string | null;
}
export interface Contact {
  id: string;
  application_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
}
export interface History {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
}
export interface Detail extends Application {
  interviews: Interview[];
  contacts: Contact[];
  history: History[];
}
export interface Page {
  items: Application[];
  total: number;
  page: number;
  page_size: number;
}
export interface Analytics {
  weekdays: { weekday: string; count: number }[];
  "response-times": { range: string; count: number }[];
  summary: Record<string, number | null>;
  funnel: { stage: string; count: number }[];
  trends: { date: string; count: number }[];
  statuses: { status: string; count: number }[];
  sources: {
    source: string;
    applications: number;
    interviews: number;
    interview_rate: number;
  }[];
}
