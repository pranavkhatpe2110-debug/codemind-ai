import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// Next.js 16 calls this file "proxy" (it used to be called "middleware").
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
