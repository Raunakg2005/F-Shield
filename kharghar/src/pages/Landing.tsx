import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import { Globe, ArrowRight, Shield, Activity, Network, Zap, CheckCircle2, BarChart3, ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Heuristics",
      desc: "Sub-50ms rule engine processing checking velocity bursts, blacklists, and volume anomalies instantly."
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Calibrated ML Models",
      desc: "XGBoost pipelines trained on millions of transaction rows, optimized for high precision precision/recall bounds."
    },
    {
      icon: <Network className="w-6 h-6" />,
      title: "Vendor Network Graphs",
      desc: "Identify organized fraud rings by tracing multi-tenant vendor relationships and funds flow across the system."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "SHAP Explainability",
      desc: "Every ML decision is broken down into human-readable rationale. Say goodbye to black-box rejections."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise Grade",
      desc: "Multi-tenant architecture with SOC2 compliance in mind. Bank-level encryption at rest and in transit."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Intelligence",
      desc: "Shared global blacklists across all tenants update in real-time to prevent repeat attacks on different vendors."
    }
  ];

  const faqs = [
    { question: "How does the four-layer detection work?", answer: "We pass transactions through a deterministic rule engine, a calibrated ML model, a network topology graph, and finally combine the scores using a proprietary risk weighting algorithm." },
    { question: "How long does integration take?", answer: "Our robust REST API can be integrated by a single developer in less than an afternoon. We provide drop-in SDKs and comprehensive docs." },
    { question: "Is the machine learning model a black box?", answer: "No. We utilize advanced SHAP (SHapley Additive exPlanations) values to output the exact human-readable reasons why a transaction was flagged, ensuring compliance and auditability." },
    { question: "What is your false positive rate?", answer: "Our multi-layer approach historically drops false positive rates by 68% compared to legacy rule-based-only systems, using targeted Isotonic Calibration." }
  ];

  return (
    <div className="bg-[#030712] text-gray-100 font-sans selection:bg-cyber-primary/30 min-h-screen overflow-hidden">

      {/* Navbar overlay */}
      <nav className="absolute top-0 w-full z-50 px-6 py-6 border-b border-white/5 bg-black/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-cyber-primary" />
            <span className="text-xl font-bold tracking-tight text-white">Fraud<span className="text-cyber-primary">Sense</span></span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
            <a href="#platform" className="hover:text-white transition-colors">Platform</a>
            <a href="#engine" className="hover:text-white transition-colors">Risk Engine</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="px-5 py-2.5 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-40 pb-32 px-6 flex flex-col items-center justify-center min-h-screen overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <motion.div style={{ y: yBg }} className="absolute w-[800px] h-[800px] bg-cyber-primary/10 rounded-full blur-[120px] opacity-50" />
          <motion.div style={{ y: yBg }} className="absolute w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] opacity-30 translate-x-1/2 -translate-y-1/4" />

          {/* Grid Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBMMDAgMEw0MCAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4=')] opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]"></div>
        </div>

        <motion.div
          style={{ opacity: opacityHero }}
          className="relative z-10 text-center max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary text-sm font-medium mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-primary"></span>
            </span>
            FraudSense Engine v2.0 is now live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]"
          >
            Stop fraud before <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">it clears the bank.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-light leading-relaxed"
          >
            An enterprise-grade, four-layer risk decision engine powered by XGBoost, Network Topologies, and Explainable AI. Reduce false positives by 68%.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-white text-black hover:bg-gray-100 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] hover:-translate-y-0.5">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#platform" className="w-full sm:w-auto px-8 py-4 bg-transparent text-white border border-gray-700 hover:border-gray-500 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-2 hover:bg-white/5">
              Explore the Engine
            </a>
          </motion.div>
        </motion.div>

        {/* Floating Mockup UI Elements */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, type: "spring", bounce: 0.2 }}
          className="relative z-10 w-full max-w-5xl mx-auto mt-24 aspect-[21/9] bg-[#0a0f16] rounded-2xl border border-gray-800 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex"
        >
          {/* Mockup Sidebar */}
          <div className="w-48 border-r border-gray-800 bg-[#05080c] hidden md:flex flex-col p-4 gap-4">
            <div className="h-4 w-24 bg-gray-800 rounded mb-4" />
            <div className="h-3 w-full bg-cyber-primary/20 rounded" />
            <div className="h-3 w-3/4 bg-gray-800 rounded" />
            <div className="h-3 w-5/6 bg-gray-800 rounded" />
            <div className="h-3 w-full bg-gray-800 rounded" />
          </div>
          {/* Mockup Main */}
          <div className="flex-1 p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="h-6 w-48 bg-gray-800 rounded" />
              <div className="h-8 w-8 bg-gray-800 rounded-full" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1 h-24 bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="h-3 w-16 bg-gray-700 rounded" />
                <div className="h-6 w-24 bg-gray-200 rounded" />
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-green-500/10 rounded-tl-full blur-xl" />
              </div>
              <div className="flex-1 h-24 bg-gray-900 border border-cyber-alert/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="h-3 w-20 bg-cyber-alert/50 rounded" />
                <div className="h-6 w-16 bg-cyber-alert rounded" />
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-cyber-alert/20 rounded-tl-full blur-xl animate-pulse" />
              </div>
              <div className="flex-1 h-24 bg-gray-900 border border-gray-800 rounded-xl p-4 hidden sm:flex flex-col justify-between">
                <div className="h-3 w-24 bg-gray-700 rounded" />
                <div className="h-6 w-32 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
              <div className="h-4 w-32 bg-gray-700 rounded mb-2" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-full bg-[#05080c] rounded flex items-center px-4 gap-4">
                  <div className="h-2 w-2 rounded-full bg-gray-700" />
                  <div className="h-2 w-24 bg-gray-800 rounded" />
                  <div className="h-2 w-32 bg-gray-800 rounded ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Overlay gradient to fade out bottom */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#030712] to-transparent" />
        </motion.div>
      </section>

      {/* Social Proof / Brands */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-gray-500 mb-8 uppercase tracking-widest">Securing volume for forward-thinking companies</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-50 grayscale">
            {/* Fake logos using text */}
            <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-white" /> Acme Corp</div>
            <div className="text-xl font-black italic tracking-tighter">GLOBALPAY</div>
            <div className="text-xl font-serif font-bold">NexaBank</div>
            <div className="text-xl font-bold font-mono">FIN/TECH</div>
          </div>
        </div>
      </section>

      {/* Engine Breakdown */}
      <section id="platform" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUpVariant}
            className="text-center mb-24"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">The Four-Layer <span className="text-cyber-primary">Defense Matrix</span></h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">We don't rely on a single point of failure. Every transaction is subjected to an orchestrator engine combining deterministic rules with stochastic advanced ML.</p>
          </motion.div>

          <div className="space-y-32">
            {/* Feature 1 */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="flex-1"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Explainable AI (SHAP)</h3>
                <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                  "Computer says no" isn't good enough for compliance. Our XGBoost model integrates directly with SHAP TreeExplainers to output structured, human-readable impact analyses for every block.
                </p>
                <ul className="space-y-3">
                  {['Feature impact ranking', 'Audit-ready rationale logs', 'Visual dashboard indicators'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-cyber-primary" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                <div className="relative bg-[#0a0f16] border border-gray-800 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                    <span className="font-mono text-sm text-gray-400">SHAP Analysis: TXN-8942A</span>
                    <span className="px-2 py-1 bg-cyber-alert/10 text-cyber-alert rounded text-xs">94.2% Risk</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center">
                      <div className="w-1/3 text-xs text-gray-400 text-right">Amount &gt; 5x Avg</div>
                      <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden flex">
                        <div className="w-[80%] bg-cyber-alert rounded-r-full" />
                      </div>
                      <div className="w-10 text-xs text-cyber-alert font-mono">+0.42</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="w-1/3 text-xs text-gray-400 text-right">Vendor Risk Score</div>
                      <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden flex">
                        <div className="w-[60%] bg-orange-400 rounded-r-full" />
                      </div>
                      <div className="w-10 text-xs text-orange-400 font-mono">+0.28</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="w-1/3 text-xs text-gray-400 text-right">Time of Day (3AM)</div>
                      <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden flex">
                        <div className="w-[45%] bg-yellow-400 rounded-r-full" />
                      </div>
                      <div className="w-10 text-xs text-yellow-400 font-mono">+0.15</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="flex-1"
              >
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20">
                  <Network className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Topology Network Graph</h3>
                <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                  Fraud doesn't happen in a vacuum. We dynamically construct bipartite graphs of your users and their counterparties, detecting organized collusion rings across the network before they strike your specific account.
                </p>
                <Link to="/signup" className="inline-flex items-center gap-2 text-cyber-primary hover:text-white transition-colors font-medium">
                  View network visualization <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <div className="flex-1 w-full relative h-[300px]">
                <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full" />
                {/* Fake Network Graph */}
                <div className="relative h-full bg-[#0a0f16] border border-gray-800 rounded-2xl p-6 shadow-2xl overflow-hidden flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="20" y1="20" x2="80" y2="50" stroke="#93c5fd" strokeWidth="0.5" />
                    <line x1="80" y1="50" x2="40" y2="80" stroke="#fca5a5" strokeWidth="0.5" />
                    <line x1="20" y1="20" x2="40" y2="80" stroke="#93c5fd" strokeWidth="0.5" />
                    <line x1="80" y1="50" x2="90" y2="20" stroke="#fca5a5" strokeWidth="0.5" />
                  </svg>
                  <div className="absolute top-[20%] left-[20%] w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                  <div className="absolute top-[50%] left-[80%] w-6 h-6 bg-cyber-alert rounded-full shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse" />
                  <div className="absolute top-[80%] left-[40%] w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                  <div className="absolute top-[20%] left-[90%] w-3 h-3 bg-cyber-alert rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Features */}
      <section className="py-24 bg-[#05080c] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Built for scale.</h2>
            <p className="text-gray-400 text-lg">Everything you need to secure your financial operations.</p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeUpVariant}
                className="bg-[#0a0f16] border border-gray-800 p-8 rounded-2xl hover:border-cyber-primary/30 transition-colors group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-cyber-primary/10 group-hover:text-cyber-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Technical FAQ</h2>
          <p className="text-gray-400 text-lg">Common questions about our architecture and accuracy.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-[#0a0f16] rounded-xl border border-gray-800 overflow-hidden"
            >
              <button
                className="w-full p-6 text-left flex justify-between items-center focus:outline-none hover:bg-white/[0.02] transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-lg font-medium pr-8">{faq.question}</span>
                <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }}>
                  <ChevronRight className={`w-5 h-5 ${openFaq === i ? 'text-cyber-primary' : 'text-gray-500'}`} />
                </motion.div>
              </button>
              {openFaq === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="px-6 pb-6 text-gray-400 leading-relaxed"
                >
                  {faq.answer}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-cyber-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-cyber-primary/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6">Ready to secure your payment flows?</h2>
          <p className="text-xl text-gray-400 mb-10">Join forward-thinking companies stopping fraud without adding friction.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-xl text-lg font-semibold transition-all">
              Create Free Account
            </Link>
            <a href="mailto:contact@fraud-sense.com" className="w-full sm:w-auto px-8 py-4 bg-[#0a0f16] text-white border border-gray-700 hover:border-gray-500 rounded-xl text-lg font-semibold transition-all">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
