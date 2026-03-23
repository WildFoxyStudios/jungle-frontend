import type { Metadata } from "next";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  await params;
  return { title: "Evento" };
}
export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await params;
  return null;
}
