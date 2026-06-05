'use client';

import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="workspace min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <h1 className="headline-xl mb-3">404</h1>
      <p className="text-slate-600 text-lg mb-8">
        This page doesn&apos;t exist.
      </p>
      <Link href="/" className="btn-primary px-8 py-3">
        Go home
      </Link>
    </div>
  );
}
