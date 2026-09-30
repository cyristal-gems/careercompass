export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map(
                (d: { loc: string[]; msg: string }) =>
                  `${d.loc.slice(1).join(" ")}: ${d.msg}`,
              )
              .join(". ")
          : detail?.message
            ? `${detail.message} ${detail.errors?.map((e: { row: number }) => `Row ${e.row}`).join(", ") || ""}`
            : "Unable to connect. Please try again.";
    // A full navigation clears stale authenticated client state when a session expires.
    if (response.status === 401 && !path.startsWith("/auth/")) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
export const label = (value: string | null | undefined) =>
  value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Not specified";
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const dateLabel = (value: string) =>
  new Date(
    value.length === 10 ? `${value}T12:00:00` : value,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
export const money = (value: number | null) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
export const salary = (min: number | null, max: number | null) =>
  min == null && max == null
    ? "Not specified"
    : `${money(min)} – ${money(max)}`;

export async function allApplications(): Promise<
  import("@/types").Application[]
> {
  const first = await api<import("@/types").Page>(
    "/applications?page_size=100",
  );
  const items = [...first.items];
  for (let page = 2; page <= Math.ceil(first.total / 100); page++) {
    items.push(
      ...(
        await api<import("@/types").Page>(
          `/applications?page_size=100&page=${page}`,
        )
      ).items,
    );
  }
  return items;
}
