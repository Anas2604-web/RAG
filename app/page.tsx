import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Logo from "@/components/ui/Logo";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/chat");

  return (
    <div className="workspace min-h-screen flex flex-col">
      <nav className="marketing-nav px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-slate-600 hover:text-slate-900 text-sm font-medium px-4 py-2 rounded-md hover:bg-slate-50 spring-transition"
          >
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary text-sm px-5 py-2.5">
            Get started
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="badge-product mb-6">
            AI-powered document research
          </div>

          <h1 className="headline-xl mb-5">
            Understand your documents,{" "}
            <span className="text-accent">not just chat with them</span>
          </h1>

          <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto leading-relaxed">
            A research workspace inspired by NotebookLM. Upload sources, explore
            citations in context, and get cited answers — with documents at the center.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn-primary text-base px-8 py-3">
              Start researching
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-3">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl w-full">
          {[
            {
              title: "Source-first layout",
              desc: "Documents live front and center. Upload, select, and manage your research sources.",
              icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            },
            {
              title: "Cited answers",
              desc: "Every response links to exact passages. Expand citations and read source context.",
              icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
            },
            {
              title: "Research insights",
              desc: "AI-generated summaries, knowledge graphs, and source connections at a glance.",
              icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
            },
          ].map(({ title, desc, icon }) => (
            <div key={title} className="surface-card p-6 text-left">
              <div className="feature-icon mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                </svg>
              </div>
              <h3 className="text-slate-900 font-semibold mb-2">{title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Research Workspace
      </footer>
    </div>
  );
}
