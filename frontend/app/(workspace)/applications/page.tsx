import { Applications } from "@/components/applications";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const query = await searchParams;
  return <Applications deleted={query.deleted === "1"} />;
}
