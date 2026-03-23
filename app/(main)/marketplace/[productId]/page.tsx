import type { Metadata } from "next";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  await params;
  return { title: "Producto" };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  await params;
  return null;
}
