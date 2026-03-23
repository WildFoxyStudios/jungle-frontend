import type { Metadata } from "next";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>;
}): Promise<Metadata> {
  await params;
  return { title: "Pedido" };
}
export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await params;
  return null;
}
