"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Deletes one history item (a conversation or a debug session). Only your own. */
export async function deleteHistoryItem(formData: FormData) {
  const kind = formData.get("kind");
  const id = formData.get("id");
  if ((kind !== "c" && kind !== "d") || typeof id !== "string" || !UUID.test(id)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (kind === "c") {
    // Messages first, so this works even without "cascade" in the database.
    await supabase.from("messages").delete().eq("conversation_id", id).eq("user_id", user.id);
    await supabase.from("conversations").delete().eq("id", id).eq("user_id", user.id);
  } else {
    await supabase.from("debug_sessions").delete().eq("id", id).eq("user_id", user.id);
  }
  revalidatePath("/history");
  redirect("/history");
}
