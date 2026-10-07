import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const initialError =
    error === "link_expired"
      ? "That link has expired or was already used. Please try again."
      : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Log in to your CodeMind AI workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm next={next} initialError={initialError} />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
