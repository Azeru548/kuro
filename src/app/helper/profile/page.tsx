import { redirect } from "next/navigation";

/** Profile settings live under Settings for discoverability. */
export default function HelperProfileRedirectPage() {
  redirect("/helper/settings");
}
