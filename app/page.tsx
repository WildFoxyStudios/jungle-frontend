import { redirect } from "next/navigation";

/**
 * Root page – immediately redirect to /home.
 * The middleware handles auth: if the user is not authenticated,
 * they will be redirected to /login instead.
 */
export default function RootPage() {
  redirect("/home");
}
