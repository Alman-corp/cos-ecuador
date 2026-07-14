"use server"

import { createClient } from "@/utils/supabase/server"

export async function appendAudit(action: string, userId: string, resource: string, details: string) {
  const supabase = await createClient()
  await supabase.from("audit_log").insert({
    user_id: userId,
    action,
    table_name: resource,
    new_values: { details },
  })
}
