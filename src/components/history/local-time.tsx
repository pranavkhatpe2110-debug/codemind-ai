"use client";

import { useEffect, useState } from "react";

/** Shows a date in the visitor's own time zone (the server does not know it). */
export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const d = new Date(iso);
    setText(
      Number.isNaN(d.getTime())
        ? ""
        : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    );
  }, [iso]);
  return <span suppressHydrationWarning>{text}</span>;
}
