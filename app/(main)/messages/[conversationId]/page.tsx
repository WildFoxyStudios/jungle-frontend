import type { Metadata } from "next";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}): Promise<Metadata> {
  await params;
  return { title: "Conversación" };
}
export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  await params;
  return null;
}
