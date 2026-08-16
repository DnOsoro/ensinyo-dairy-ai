import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MarketplacePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * If the visitor is not logged in,
   * send them to the login page.
   */
  if (!user) {
    redirect("/login");
  }

  /*
   * Logged-in farmers go directly
   * to the actual marketplace.
   */
  redirect("/dashboard/marketplace");
}