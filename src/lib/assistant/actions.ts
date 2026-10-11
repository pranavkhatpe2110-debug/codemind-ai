"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Deletes one conversation (its messages go with it). RLS: only your own. */
export async function deleteConversation(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !UUID.test(id)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Messages first, so this works even without "cascade" in the database.
  await supabase.from("messages").delete().eq("conversation_id", id).eq("user_id", user.id);
  await supabase.from("conversations").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/assistant");
  redirect("/assistant");
}
