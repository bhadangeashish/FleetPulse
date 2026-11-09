import React, { useState } from 'react';
import {
  Truck,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  Shield,
  Smartphone,
  CreditCard,
  FileText,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  Package,
  Layers,
  Award,
  Users,
  Send,
  Phone,
  Mail,
  Building,
  Check,
  Disc,
  Clock,
  Download,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';

export const FleetPulseLandingView: React.FC = () => {
  const { setActiveTab, setRole, companyName } = useTMS();

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCategory, setContactCategory] = useState('Interstate Fruit Transport');
  const [contactMessage, setContactMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Portal launcher modal state
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);

  const handleLaunchPortal = (targetRole: 'admin' | 'operator' | 'driver', tab: string) => {
    setRole(targetRole);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setFormSubmitted(false);
    }, 3500);
  };

  return (
    <div className="min-h-screen luminous-bg font-body text-slate-800 antialiased selection:bg-[#BDDDFC] selection:text-[#384959] pb-20 relative overflow-hidden">
      {/* Soft Ambient Chromatic Blur Blobs (Inspired by screenshot's liquid background) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#BDDDFC]/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-[30rem] h-[30rem] bg-[#88BDF2]/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[60rem] left-10 w-[28rem] h-[28rem] bg-[#BDDDFC]/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ========================================================
          1. FLOATING GLASS PILL NAVBAR (Matches Screenshot Top Nav)
          ======================================================== */}
      <header className="sticky top-4 z-50 px-4 sm:px-6 max-w-6xl mx-auto">
        <nav className="glass-pill px-4 sm:px-6 py-2.5 rounded-full flex items-center justify-between shadow-[0_10px_30px_rgba(15,23,42,0.06)] border border-white/80">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#384959] text-white flex items-center justify-center font-heading font-black text-xs shadow-md shadow-slate-900/20">
              FP
            </div>
            <div>
              <span className="font-heading font-extrabold text-xs text-[#384959] tracking-tight block leading-tight">
                {companyName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block leading-none">
                Freight & Fleet Operations
              </span>
            </div>
          </div>

          {/* Centered Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1 text-[11px] font-bold text-slate-600">
            <a href="#home" className="px-3 py-1.5 rounded-full bg-white text-[#384959] shadow-2xs">
              Home
            </a>
            <a href="#about" className="px-3 py-1.5 rounded-full hover:text-[#384959] hover:bg-white/60 transition-all">
              About
            </a>
            <a href="#services" className="px-3 py-1.5 rounded-full hover:text-[#384959] hover:bg-white/60 transition-all">
              Services
            </a>
            <a href="#operations" className="px-3 py-1.5 rounded-full hover:text-[#384959] hover:bg-white/60 transition-all">
              Operations
            </a>
            <a href="#process" className="px-3 py-1.5 rounded-full hover:text-[#384959] hover:bg-white/60 transition-all">
              Process
            </a>
            <a href="#testimonials" className="px-3 py-1.5 rounded-full hover:text-[#384959] hover:bg-white/60 transition-all">
              Testimonials
            </a>
            <a href="#contact" className="px-3 py-1.5 rounded-full hover:text-[#384959] hover:bg-white/60 transition-all">
              Contact
            </a>
          </div>

          {/* Right Action: Launch Portals Button */}
          <button
            onClick={() => setIsPortalModalOpen(true)}
            className="bg-[#384959] hover:bg-[#2C3A47] text-white rounded-full px-4 py-2 text-xs font-heading font-bold shadow-md shadow-slate-900/15 flex items-center gap-1.5 transition-all cursor-pointer group"
          >
            <span>Enter Portals</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </nav>
      </header>

      {/* ========================================================
          2. HERO SECTION (Matches Screenshot Hero with Glass Widgets)
          ======================================================== */}
      <section id="home" className="pt-12 sm:pt-16 pb-14 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Headlines & CTA Buttons */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 glass-pill px-3.5 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest bg-gradient-to-r from-[#384959] via-[#6A89A7] to-[#88BDF2] bg-clip-text text-transparent">
                Maharashtra ⇄ Gujarat Freight Highway
              </span>
            </div>

            {/* Main Title with Gradient Accent */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-[#384959] tracking-tight leading-[1.12]">
              Intelligent Freight & Fleet{' '}
              <span className="bg-gradient-to-r from-[#384959] via-[#6A89A7] to-[#88BDF2] bg-clip-text text-transparent block sm:inline">
                Operations Console
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-xl">
              Enterprise transportation management system engineered for multi-destination fruit delivery drops, backhaul return load matching, tamper-evident LR lifecycle signoff, and automated freight payment reconciliation.
            </p>

            {/* CTA Buttons (Dark Pill + Frosted Glass Pill) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleLaunchPortal('admin', 'dashboard')}
                className="bg-[#384959] hover:bg-[#2C3A47] text-white rounded-full px-6 py-3 font-heading font-bold text-xs shadow-lg shadow-slate-900/15 flex items-center gap-2 transition-all cursor-pointer group"
              >
                <span>Launch Admin Console</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={() => handleLaunchPortal('driver', 'driver_portal')}
                className="glass-panel hover:bg-white text-slate-800 rounded-full px-6 py-3 font-heading font-bold text-xs shadow-xs hover:shadow-sm border border-white/90 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#6A89A7]" />
                <span>Driver Mobile Portal</span>
              </button>
            </div>

            {/* Trusted By / Corridor Badges (Matches screenshot bottom of hero) */}
            <div className="pt-6 border-t border-slate-200/60 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Trade Corridor APMCs & Mandi Terminals
              </span>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 opacity-70 grayscale hover:grayscale-0 transition-all text-xs font-heading font-extrabold text-slate-700">
                <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-[#6A89A7]" /> Pune APMC</span>
                <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-[#384959]" /> Surat Ring Road</span>
                <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-[#6A89A7]" /> Vapi Wholesale</span>
                <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-emerald-500" /> Ahmedabad Naroda</span>
                <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-amber-500" /> Bhiwandi Hub</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Glass Visual Showcase (Matches Portrait & Floating Stat Chips in screenshot) */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-6 lg:pt-0">
            {/* Ambient Glass Orb Behind */}
            <div className="w-64 h-64 bg-gradient-to-br from-[#BDDDFC]/40 via-[#88BDF2]/30 to-[#BDDDFC]/40 rounded-full blur-2xl absolute -top-4 -right-4 -z-10" />

            {/* Main Frosted Glass Card Container */}
            <div className="glass-panel p-4 sm:p-5 rounded-3xl w-full max-w-md shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-white/90 relative">
              {/* Top Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#BDDDFC]/20 border border-[#DCE8F2] flex items-center justify-center text-[#6A89A7]">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-heading font-extrabold text-xs text-[#384959] block">Fleet Rig Status</span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Live GPS Dispatch
                    </span>
                  </div>
                </div>

                <span className="bg-[#F8FAFC] text-[#6A89A7] border border-[#DCE8F2] text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                  MH ⇄ GJ
                </span>
              </div>

              {/* Central Graphic: Rig Illustration & Operational Health */}
              <div className="py-4 space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#384959] via-[#2C3A47] to-[#384959] p-5 text-white shadow-inner">
                  <div className="flex items-center justify-between text-xs font-mono text-[#BDDDFC] mb-2">
                    <span>Tata Signa 2823 HD</span>
                    <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-md">24-TON RIG</span>
                  </div>
                  <div className="text-lg font-heading font-black tracking-tight text-white">
                    MH-12-RN-4892
                  </div>
                  <div className="text-[11px] text-[#BDDDFC] mt-1">
                    Enroute: Pune APMC ➔ Surat Ring Road Mandi
                  </div>

                  {/* Capacity Bar Display (Master Prompt Section 4) */}
                  <div className="mt-4 pt-3 border-t border-white/15 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-[#BDDDFC]">Load: 20,400 KG</span>
                      <span className="text-emerald-300 font-bold">Capacity: 24,000 KG</span>
                    </div>
                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#88BDF2] to-emerald-400 h-full rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>

                {/* Micro Stats Row */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/60 border border-white/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Current ODO</span>
                    <span className="font-mono font-bold text-[#384959] text-sm">89,450 KM</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 border border-white/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Next Servicing</span>
                    <span className="font-mono font-bold text-amber-700 text-sm">90,000 KM</span>
                  </div>
                </div>
              </div>

              {/* FLOATING GLASS STAT CHIP: 15+ Years (Top Right) */}
              <div className="absolute -top-3 -right-3 glass-pill px-3 py-1.5 rounded-2xl shadow-md border border-white/90 text-right">
                <span className="text-base font-heading font-black text-[#384959] block leading-tight">15+</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight block">Years Trade</span>
              </div>

              {/* FLOATING GLASS STAT CHIP: Efficiency +120% (Bottom Right - Exactly matches screenshot!) */}
              <div className="absolute -bottom-4 -right-3 glass-panel px-3.5 py-2 rounded-2xl shadow-lg border border-white/90 flex items-center gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">Fleet Efficiency</span>
                  <span className="text-sm font-heading font-black text-[#6A89A7] block leading-tight">+120%</span>
                </div>
                {/* Micro Sparkline Curve */}
                <svg className="w-12 h-6 text-[#6A89A7] stroke-current stroke-2 fill-none" viewBox="0 0 50 25">
                  <path d="M2,20 Q15,18 22,10 T38,8 T48,2" />
                </svg>
              </div>

              {/* FLOATING GLASS STAT CHIP: Stamped LR Verified (Bottom Left) */}
              <div className="absolute -bottom-3 -left-3 glass-pill px-3 py-1.5 rounded-2xl shadow-md border border-white/90 flex items-center gap-1.5 text-[10px] font-bold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Stamped LR Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. "ABOUT FLEETPULSE / MISSION" SECTION
          (Matches "Designing with Empathy / Building with Purpose")
          ======================================================== */}
      <section id="about" className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/80 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-3">
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#6A89A7]">
                About FleetPulse
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#384959] tracking-tight">
                Moving Interstate Freight with Precision & Absolute Accountability
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Operating on the vital Maharashtra to Gujarat transport artery, FleetPulse transforms traditional perishable fruit dispatches into a digitized, transparent workflow. From farm-gate crates to backhaul industrial cargo, we eliminate deadhead miles and accelerate payment clearance.
              </p>
            </div>

            <div className="md:col-span-5 flex md:justify-end">
              <button
                onClick={() => handleLaunchPortal('admin', 'vehicles')}
                className="glass-pill px-5 py-2.5 rounded-full text-xs font-heading font-bold text-[#384959] hover:bg-white shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Inspect Fleet Vehicles</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#6A89A7]" />
              </button>
            </div>
          </div>

          {/* 3 Frosted Glass Stat Cards (Matches 5+, 30+, 15+ cards in screenshot) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="glass-panel-subtle p-4 rounded-2xl border border-white/80 space-y-1">
              <div className="flex items-center justify-between text-[#6A89A7]">
                <Award className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Total Volume</span>
              </div>
              <span className="text-2xl sm:text-3xl font-heading font-black text-[#384959] block">15,000+</span>
              <span className="text-xs font-medium text-slate-600 block">Metric Tons Delivered</span>
            </div>

            <div className="glass-panel-subtle p-4 rounded-2xl border border-white/80 space-y-1">
              <div className="flex items-center justify-between text-[#6A89A7]">
                <Truck className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Dispatch Count</span>
              </div>
              <span className="text-2xl sm:text-3xl font-heading font-black text-[#384959] block">4,200+</span>
              <span className="text-xs font-medium text-slate-600 block">Trips Completed Safely</span>
            </div>

            <div className="glass-panel-subtle p-4 rounded-2xl border border-white/80 space-y-1">
              <div className="flex items-center justify-between text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Settlement</span>
              </div>
              <span className="text-2xl sm:text-3xl font-heading font-black text-[#384959] block">99.4%</span>
              <span className="text-xs font-medium text-slate-600 block">On-Time Payment Clearance</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. "FLEET SERVICES WE OFFER" SECTION
          (Matches "Services I Offer" 4-card grid in screenshot)
          ======================================================== */}
      <section id="services" className="py-12 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
        <div>
          <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#6A89A7] block">
            Core Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#384959] tracking-tight">
            Integrated Freight Solutions
          </h2>
        </div>

        {/* 4 Frosted Glass Cards with corner arrow (Matches screenshot) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Multi-Drop Fruit Logistics */}
          <div
            onClick={() => handleLaunchPortal('admin', 'trips')}
            className="glass-panel p-5 rounded-2xl border border-white/80 space-y-3 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#DCE8F2] flex items-center justify-center text-[#6A89A7]">
                <Package className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#384959] group-hover:text-[#6A89A7] transition-colors">
                Multi-Drop Fruit Logistics
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Optimize sequential APMC drops across Vapi, Surat, Vadodara, and Ahmedabad with auto-calculating crate item pricing.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#6A89A7] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </div>

          {/* Card 2: Backhaul Return Matching */}
          <div
            onClick={() => handleLaunchPortal('admin', 'trips')}
            className="glass-panel p-5 rounded-2xl border border-white/80 space-y-3 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2FA] border border-[#BDDDFC] flex items-center justify-center text-[#384959]">
                <Truck className="w-4 h-4 text-[#384959]" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#384959] group-hover:text-[#6A89A7] transition-colors">
                Backhaul Return Matching
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Zero deadhead return trips. Match Gujarat loading parties with multi-point unloading destinations in Maharashtra.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#6A89A7] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </div>

          {/* Card 3: LR & Stamped Verification */}
          <div
            onClick={() => handleLaunchPortal('admin', 'payments')}
            className="glass-panel p-5 rounded-2xl border border-white/80 space-y-3 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#DCE8F2] flex items-center justify-center text-[#6A89A7]">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#384959] group-hover:text-[#6A89A7] transition-colors">
                LR & Stamped Verification
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Independent tracking of Lorry Receipts: capture consignee rubber stamps and track handover to loading parties cleanly.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#6A89A7] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </div>

          {/* Card 4: Multi-Stage Settlement */}
          <div
            onClick={() => handleLaunchPortal('admin', 'reports')}
            className="glass-panel p-5 rounded-2xl border border-white/80 space-y-3 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#384959] group-hover:text-emerald-600 transition-colors">
                Payment Reconciliation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Manage partial installments, due date tracking, automated overdue alerts, and 9 dedicated multi-city export reports.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. "TECHNOLOGIES & FLEET ROSTER" SECTION
          (Matches "Technologies I Use" horizontal pill row in screenshot)
          ======================================================== */}
      <section className="py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-4">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 text-center block">
          Supported Fleet Capacities & Technology Stack
        </span>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {[
            { label: '24-Ton Heavy Rig', icon: Truck },
            { label: '16-Ton Cargo Carrier', icon: Truck },
            { label: '10-Ton Truck', icon: Truck },
            { label: 'Tata Signa HD', icon: Disc },
            { label: 'BharatBenz Rig', icon: Disc },
            { label: 'IndexedDB PWA', icon: Smartphone },
            { label: 'WhatsApp Links', icon: Send },
            { label: 'Multi-City Reporting', icon: FileText },
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-pill px-4 py-2 rounded-xl text-xs font-heading font-bold text-slate-700 flex items-center gap-2 hover:bg-white transition-colors border border-white/80 shadow-2xs"
            >
              <item.icon className="w-3.5 h-3.5 text-[#6A89A7]" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          6. "SELECTED OPERATIONS & MODULES" SECTION
          (Matches "Selected Work" cards in screenshot)
          ======================================================== */}
      <section id="operations" className="py-12 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#6A89A7] block">
              Operational Showcase
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#384959] tracking-tight">
              Live Logistics Modules
            </h2>
          </div>

          <button
            onClick={() => handleLaunchPortal('admin', 'dashboard')}
            className="text-xs font-heading font-bold text-[#6A89A7] hover:text-[#6A89A7] flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Launch Complete System</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Showcase Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Work 1: Admin Command Dashboard */}
          <div
            onClick={() => handleLaunchPortal('admin', 'dashboard')}
            className="glass-panel p-4 rounded-3xl border border-white/80 space-y-3 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          >
            <div className="rounded-2xl overflow-hidden bg-[#384959] p-4 text-white relative h-40 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[10px] font-mono text-[#BDDDFC]">
                <span>Executive Command</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">14 KPIs</span>
              </div>
              <div>
                <span className="text-sm font-heading font-bold block text-white">Admin Fleet Dashboard</span>
                <span className="text-[11px] text-slate-400">Live operational health & alerts</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <h4 className="font-heading font-bold text-xs text-[#384959]">Admin Operations Center</h4>
                <span className="text-[11px] text-slate-500">Fleet Control & Monitoring</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#6A89A7] transition-colors" />
            </div>
          </div>

          {/* Work 2: Driver Mobile PWA */}
          <div
            onClick={() => handleLaunchPortal('driver', 'driver_portal')}
            className="glass-panel p-4 rounded-3xl border border-white/80 space-y-3 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          >
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#384959] to-[#2C3A47] p-4 text-white relative h-40 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[10px] font-mono text-[#BDDDFC]">
                <span>Mobile PWA Console</span>
                <span className="bg-white/20 text-white px-2 py-0.5 rounded-full">IndexedDB</span>
              </div>
              <div>
                <span className="text-sm font-heading font-bold block text-white">Driver Offline Portal</span>
                <span className="text-[11px] text-[#BDDDFC]">Trip logging, tyre changes & scans</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <h4 className="font-heading font-bold text-xs text-[#384959]">Driver Companion App</h4>
                <span className="text-[11px] text-slate-500">Highway low-signal ready</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#6A89A7] transition-colors" />
            </div>
          </div>

          {/* Work 3: Dedicated 9-Report Hub */}
          <div
            onClick={() => handleLaunchPortal('admin', 'reports')}
            className="glass-panel p-4 rounded-3xl border border-white/80 space-y-3 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          >
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#384959] to-slate-900 p-4 text-white relative h-40 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[10px] font-mono text-[#BDDDFC]">
                <span>Section 10 Standard</span>
                <span className="bg-[#BDDDFC]/20 text-[#BDDDFC] px-2 py-0.5 rounded-full border border-[#DCE8F2]">PDF & Excel</span>
              </div>
              <div>
                <span className="text-sm font-heading font-bold block text-white">Dedicated Reports Hub</span>
                <span className="text-[11px] text-slate-300">Load-wise freight ledger & settlements</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <h4 className="font-heading font-bold text-xs text-[#384959]">Advanced Reporting Engine</h4>
                <span className="text-[11px] text-slate-500">City-wise, party-wise & LR audits</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#6A89A7] transition-colors" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. "OPERATIONAL PROCESS WE FOLLOW" SECTION
          (Matches "Design Process I Follow" 5 steps in screenshot)
          ======================================================== */}
      <section id="process" className="py-12 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
        <div>
          <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#6A89A7] block">
            Corridor Protocol
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#384959] tracking-tight">
            Our 5-Stage Logistics Pipeline
          </h2>
        </div>

        {/* 5 Process Cards with Step Numbers (Matches screenshot) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              step: '01',
              title: 'Rig & ODO Check',
              desc: 'Vehicle capacity verified, ODO rollback prevention logged, and statutory KYC confirmed.',
            },
            {
              step: '02',
              title: 'Multi-Drop Run',
              desc: 'Outbound fresh fruit loaded in Maharashtra; sequential APMC drop stops in Gujarat.',
            },
            {
              step: '03',
              title: 'Unloading & Stamp',
              desc: 'Consignees receive goods; driver captures official rubber stamp on physical Lorry Receipt.',
            },
            {
              step: '04',
              title: 'Backhaul Match',
              desc: 'Loading party matched in Gujarat for return cargo heading to Maharashtra drop points.',
            },
            {
              step: '05',
              title: 'LR Handover & Pay',
              desc: 'LR submitted to loading party; partial/full payments cleared with zero pending balances.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-panel p-4 rounded-2xl border border-white/80 space-y-2 relative"
            >
              <div className="text-xl font-heading font-black text-[#6A89A7] font-mono">
                {item.step}
              </div>
              <h4 className="font-heading font-extrabold text-xs text-[#384959]">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          8. "WHAT CLIENTS SAY" SECTION (Matches screenshot)
          ======================================================== */}
      <section id="testimonials" className="py-12 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
        <div>
          <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#6A89A7] block">
            Partner Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#384959] tracking-tight">
            Trusted by Transport Leaders
          </h2>
        </div>

        {/* 3 Frosted Glass Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/80 space-y-3 flex flex-col justify-between">
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Managing fruit drops across Surat and Ahmedabad used to lead to constant LR delays. FleetPulse has unified our stamped receipt workflow and expedited payment clearance."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#384959] text-white font-bold text-xs flex items-center justify-center font-heading">
                KP
              </div>
              <div>
                <span className="font-heading font-bold text-xs text-[#384959] block">Kantilal Patel</span>
                <span className="text-[10px] text-slate-500">Consignor, Surat APMC Market</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/80 space-y-3 flex flex-col justify-between">
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "The backhaul return load matching has cut our empty running miles down to zero. Drivers easily update work logs and tyre replacements directly from highway stops."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#384959] text-white font-bold text-xs flex items-center justify-center font-heading">
                SS
              </div>
              <div>
                <span className="font-heading font-bold text-xs text-[#384959] block">Sukhwinder Singh</span>
                <span className="text-[10px] text-slate-500">Senior Fleet Driver & Rig Lead</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/80 space-y-3 flex flex-col justify-between">
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "The Section 10 dedicated reports hub gives our accounting team 1-click clarity on pending transport receivables across all Gujarat cities in seconds."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#384959] text-white font-bold text-xs flex items-center justify-center font-heading">
                RT
              </div>
              <div>
                <span className="font-heading font-bold text-xs text-[#384959] block">Rajesh Tiwari</span>
                <span className="text-[10px] text-slate-500">Accounts Controller, Pune Mandi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          9. "LET'S CONNECT / CONTACT FORM" SECTION
          (Matches screenshot bottom contact section)
          ======================================================== */}
      <section id="contact" className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.06)] relative overflow-hidden">
          {/* Subtle 3D Glass Ribbon Glow Accent */}
          <div className="w-64 h-64 bg-gradient-to-tr from-[#BDDDFC]/40 via-[#88BDF2]/30 to-[#BDDDFC]/40 rounded-full blur-2xl absolute -bottom-10 -right-10 pointer-events-none -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Contact Info */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#6A89A7] block">
                Let's Connect
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#384959] tracking-tight">
                Have a Freight Inquiry or Fleet Requirement?
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Speak directly with our transport dispatch coordinators in Pune or Surat to onboard vehicles, arrange backhaul cargo, or integrate your APMC account.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-3 text-slate-700">
                  <Mail className="w-4 h-4 text-[#6A89A7]" />
                  <span className="font-mono">operations@{companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Phone className="w-4 h-4 text-[#6A89A7]" />
                  <span className="font-mono">+91 98240 77192 / +91 98000 00000</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <MapPin className="w-4 h-4 text-[#6A89A7]" />
                  <span>Market Yard APMC Terminal, Maharashtra ⇄ Gujarat Trade Corridor</span>
                </div>
              </div>
            </div>

            {/* Right: Frosted Glass Form (Matches screenshot) */}
            <div className="lg:col-span-7">
              <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-heading font-bold text-slate-700 block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Patel"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/70 border border-white/90 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#88BDF2] text-xs text-[#384959] shadow-2xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-heading font-bold text-slate-700 block mb-1">Email / Phone</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. suresh@apmc.in"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/70 border border-white/90 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#88BDF2] text-xs text-[#384959] shadow-2xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-heading font-bold text-slate-700 block mb-1">Freight Requirement</label>
                  <select
                    value={contactCategory}
                    onChange={(e) => setContactCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/70 border border-white/90 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#88BDF2] text-xs text-[#384959] shadow-2xs font-medium"
                  >
                    <option value="Interstate Fruit Transport">Interstate Fruit Transport (MH ➔ GJ)</option>
                    <option value="Backhaul Return Load Booking">Backhaul Return Load Booking (GJ ➔ MH)</option>
                    <option value="Truck Roster Onboarding">Truck Roster Onboarding (Vehicle Owner)</option>
                    <option value="Mandi Trading Commission Account">Mandi Trading Commission Account</option>
                  </select>
                </div>

                <div>
                  <label className="font-heading font-bold text-slate-700 block mb-1">Your Message</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details about loading dates, goods description, and delivery destination..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/70 border border-white/90 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#88BDF2] text-xs text-[#384959] shadow-2xs font-medium resize-none"
                  />
                </div>

                {formSubmitted && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Inquiry submitted! Our fleet dispatch controller will contact you shortly.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-[#384959] hover:bg-[#2C3A47] text-white rounded-xl font-heading font-bold text-xs shadow-md shadow-slate-900/15 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <span>Send Message</span>
                  <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          10. PORTAL LAUNCHER MODAL (Admin / User / Driver)
          ======================================================== */}
      {isPortalModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#384959]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-white/90 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/80">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#6A89A7]" />
                <h3 className="font-heading font-bold text-sm text-[#384959]">
                  Select Portal Gateway
                </h3>
              </div>
              <button
                onClick={() => setIsPortalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Select which portal you would like to enter in {companyName}:
            </p>

            <div className="space-y-2.5">
              {/* Admin Portal Gateway */}
              <button
                onClick={() => handleLaunchPortal('admin', 'dashboard')}
                className="w-full p-3.5 rounded-2xl glass-panel-subtle hover:bg-white text-left border border-white/80 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#384959] text-white flex items-center justify-center font-heading font-bold text-xs">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xs text-[#384959] block group-hover:text-[#6A89A7] transition-colors">
                      Admin Portal
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Complete control: KPIs, vehicles, LRs, and 9 reports
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#6A89A7] group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* User Portal Gateway */}
              <button
                onClick={() => handleLaunchPortal('operator', 'trips')}
                className="w-full p-3.5 rounded-2xl glass-panel-subtle hover:bg-white text-left border border-white/80 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#384959] text-white flex items-center justify-center font-heading font-bold text-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xs text-[#384959] block group-hover:text-[#6A89A7] transition-colors">
                      User / Operator Portal
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Daily dispatches, trips approval & party operations
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#6A89A7] group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Driver Portal Gateway */}
              <button
                onClick={() => handleLaunchPortal('driver', 'driver_portal')}
                className="w-full p-3.5 rounded-2xl glass-panel-subtle hover:bg-white text-left border border-white/80 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#384959] text-white flex items-center justify-center font-heading font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-[#BDDDFC]" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xs text-[#384959] block group-hover:text-[#6A89A7] transition-colors">
                      Driver Mobile PWA
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Offline sync, daily work logs, and stamped LR upload
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#384959] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

