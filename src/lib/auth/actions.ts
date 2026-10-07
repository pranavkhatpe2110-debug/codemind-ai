"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

async function getOrigin() {
  const h = await headers();
  return (
    h.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address.", email };
  }
  if (!password) {
    return { error: "Please enter your password.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : error.message === "Email not confirmed"
          ? "Please confirm your email first. Check your inbox for the link."
          : error.message;
    return { error: message, email };
  }

  redirect(safeNext(formData.get("next")));
}

export async function register(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!name) return { error: "Please enter your name.", email };
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address.", email };
  }
  if (password.length < MIN_PASSWORD) {
    return {
      error: `Password must be at least ${MIN_PASSWORD} characters.`,
      email,
    };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match.", email };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: error.message, email };

  // If email confirmation is turned off in Supabase, the user is logged in now.
  if (data.session) redirect("/dashboard");

  return {
    success:
      "Account created! Check your email for a confirmation link, then log in.",
    email,
  };
}

export async function forgotPassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address.", email };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message, email };

  // Same message whether or not the email exists, so nobody can probe accounts.
  return {
    success:
      "If an account exists for that email, a password reset link is on its way.",
    email,
  };
}

export async function resetPassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD) {
    return { error: `Password must be at least ${MIN_PASSWORD} characters.` };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "This reset link has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
