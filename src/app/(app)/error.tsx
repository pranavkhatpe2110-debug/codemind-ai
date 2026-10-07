"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title="Something went wrong"
      description="An unexpected error happened while loading this page. Please try again."
      action={<Button onClick={() => reset()}>Try again</Button>}
    />
  );
}
