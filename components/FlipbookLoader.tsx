"use client";

import dynamic from "next/dynamic";

const Flipbook = dynamic(() => import("@/components/Flipbook").then((mod) => mod.Flipbook), {
  ssr: false,
  loading: () => (
    <p className="boot" role="status">
      Opening the guide…
    </p>
  ),
});

export function FlipbookLoader() {
  return <Flipbook />;
}
