import { ApplicationDetail } from "@/components/application-detail";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ contact_error?: string; created?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <ApplicationDetail
      id={id}
      contactError={query.contact_error === "1"}
      created={query.created === "1"}
    />
  );
}
