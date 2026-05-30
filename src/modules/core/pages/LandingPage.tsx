import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f8f6] to-[#f5fcf9]">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-4 bg-white/85 backdrop-blur-xl border-b border-[#218078]/10">
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/hadima-logo.png" alt="HADIMA Africa" className="h-10 w-auto" />
          <span className="font-semibold text-[#14564f] text-lg hidden sm:block">HADIMA Africa</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-5 py-2 text-sm font-medium text-[#218078] border border-[#218078]/30 rounded-full hover:bg-[#218078]/5 transition-colors">Sign In</Link>
          <Link to="/register" className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#14564f] to-[#218078] rounded-full hover:shadow-lg transition-all">Become a Member</Link>
        </div>
      </nav>

      <section className="pt-28 pb-16 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#218078]/10 rounded-full text-[#218078] text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Member Portal · 2026
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0a1e1b] leading-tight mb-4">
              Fostering <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#218078] to-[#2aa08a]">Resilience</span>
              <br />&amp; Hope for Mental<br />Well-being
            </h1>
            <p className="text-lg text-[#4a6762] max-w-lg mb-8 leading-relaxed">
              Empowering individuals and communities through holistic support, education, and advocacy for mental health awareness across Africa.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold bg-gradient-to-r from-[#14564f] to-[#218078] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                Join HADIMA Today <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 text-[#218078] font-semibold border-2 border-[#218078]/25 rounded-full hover:bg-[#218078]/5 transition-all">
                Member Login
              </Link>
            </div>

          </div>

          <div className="hidden lg:flex justify-center">
            <div className="relative">
              <div className="absolute top-8 right-4 w-20 h-20 rounded-full border-2 border-dashed border-[#218078]/25 animate-spin" style={{ animationDuration: '12s' }} />
              <div className="w-80 h-96 bg-gradient-to-b from-[#14564f] to-[#218078] rounded-3xl shadow-2xl p-8 flex flex-col justify-end text-white">
                <div className="text-xs uppercase tracking-widest opacity-70 mb-3">Current Campaign</div>
                <div className="text-2xl font-bold leading-tight mb-2">Healthy Mind,<br />Healthy Heart</div>
                <div className="text-sm opacity-80">HADIMA Africa Fundraising 2026</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 text-center text-sm text-[#8aaaa3]">
        &copy; {new Date().getFullYear()} HADIMA Africa. All rights reserved.
      </footer>
    </div>
  )
}
