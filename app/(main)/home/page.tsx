import type { Metadata } from "next";
import { HomeFeed } from "./home-feed";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Tu feed personalizado de Social",
};

export default function HomePage() {
  return <HomeFeed />;
}
