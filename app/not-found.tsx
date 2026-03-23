import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function NotFound() {
  return (
    <main>
      <h1>404 – Página no encontrada</h1>
      <p>La página que buscas no existe.</p>
      <Link href="/home">Ir al inicio</Link>
    </main>
  );
}
