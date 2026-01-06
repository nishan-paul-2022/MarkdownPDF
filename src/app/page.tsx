import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowRight, FileText, Layout, Share2, Sparkles } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/converter");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden selection:bg-blue-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse " style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      {/* Navigation */}
      <header className="relative z-50 flex items-center justify-between px-6 lg:px-12 h-20 border-b border-white/5 backdrop-blur-md bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <Image src="/brand-logo.svg" alt="Markify" width={24} height={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">Markify</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
          <a href="#showcase" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Showcase</a>
        </div>
        <form action={async () => {
          "use server"
          await signIn("google")
        }}>
          <Button variant="outline" className="rounded-full px-6 border-white/10 hover:bg-white/5 transition-all">
            Log In
          </Button>
        </form>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow">
        <section className="px-6 pt-20 pb-32 lg:pt-32 lg:pb-48 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transform your writing</span>
          </div>
          
          <h1 className="text-5xl lg:text-8xl font-black tracking-tighter mb-8 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Markdown to PDF.<br className="hidden md:block" /> Reimagined.
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Create professional documents, assignments, and reports with Markify. 
            The most powerful Markdown editor that feels like a dream.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <form action={async () => {
              "use server"
              await signIn("google")
            }}>
              <Button size="lg" className="h-14 px-8 rounded-2xl bg-white text-slate-950 hover:bg-slate-200 transition-all text-base font-bold group">
                Continue with Google
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-4 sm:mt-0 font-medium">
              Join 10,000+ creators and students today
            </p>
          </div>
        </section>

        {/* Features Preview */}
        <section id="features" className="px-6 py-24 bg-slate-900/40 relative border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-slate-950/50 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Live Preview</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  See your changes instantly with our butter-smooth real-time preview engine.
                </p>
              </div>
              
              <div className="p-8 rounded-3xl bg-slate-950/50 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Rich Metadata</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Support for cover pages, university logos, and professional headers.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-slate-950/50 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Export</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Convert to pixel-perfect PDFs in one click. Perfect for submissions.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="showcase" className="px-6 py-32 max-w-7xl mx-auto">
          <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-900 shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20" />
            <div className="relative p-2 lg:p-4">
               <div className="bg-slate-950 rounded-[2rem] overflow-hidden aspect-video relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                  <div className="flex flex-col items-center gap-6 animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                       <FileText className="w-8 h-8 text-white/50" />
                    </div>
                    <span className="text-slate-500 text-sm font-medium tracking-widest uppercase">Markify Dashboard Preview</span>
                  </div>
               </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-6 py-12 border-t border-white/5 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3 opacity-50">
          <Image src="/brand-logo.svg" alt="Markify" width={20} height={20} />
          <span className="text-sm font-bold">Markify</span>
        </div>
        <p className="text-slate-500 text-xs font-medium">
          © 2026 Markify Labs. Built for speed and beauty.
        </p>
        <div className="flex gap-6 text-xs font-medium text-slate-500">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
