import { redirect } from "next/navigation";

/**
 * Root page — immediately redirects to the Guides directory,
 * which is the entry point for Developer 3's feature scope.
 */
export default function RootPage() {
  redirect("/guides");
}
