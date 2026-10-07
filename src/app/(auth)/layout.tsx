import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(139,92,246,0.22),transparent)]"
      />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
