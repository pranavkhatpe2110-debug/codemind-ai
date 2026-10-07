import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export function ComingSoon({
  title,
  description,
  phase,
  icon,
}: {
  title: string;
  description: string;
  phase: number;
  icon: LucideIcon;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="This page is under construction"
        description={`We will build the real ${title} in Phase ${phase} of the project.`}
      />
    </>
  );
}
