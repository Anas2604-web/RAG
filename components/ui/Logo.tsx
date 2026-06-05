"use client";

import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
}

const sizes = {
  sm: { icon: "w-8 h-8", text: "text-lg", svg: "w-4 h-4" },
  md: { icon: "w-9 h-9", text: "text-xl", svg: "w-5 h-5" },
  lg: { icon: "w-10 h-10", text: "text-2xl", svg: "w-5 h-5" },
};

export default function Logo({ size = "md", href = "/" }: LogoProps) {
  const s = sizes[size];

  const content = (
    <div className="flex items-center gap-2.5">
      <div className={`${s.icon} rounded-lg bg-blue-600 flex items-center justify-center`}>
        <svg
          className={`${s.svg} text-white`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <span className={`${s.text} font-bold text-slate-900 tracking-tight`}>
        Research Workspace
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
