import Link from "next/link";
import { ArrowLeft, Shield, Mail, Globe, Clock, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | InstaFlow",
  description: "Learn how InstaFlow collects, uses, and safeguards your Instagram account and automation data.",
};

export default function PrivacyPolicy() {
  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-slate-900 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            InstaFlow
          </span>
        </div>
        
        <Link 
          href="/" 
          className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-3xl mx-auto px-6 py-12 z-10 flex-grow">
        <div className="glass-card p-8 md:p-12 rounded-3xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm text-cyan-400 font-semibold tracking-wide uppercase">
              Last Updated: June 2026
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            InstaFlow Privacy Policy
          </h1>
          
          <p className="text-slate-400 mb-8 leading-relaxed">
            InstaFlow provides Instagram automation services for connected Instagram Business and Creator accounts. We are committed to transparency in how we collect and process your information.
          </p>

          <div className="space-y-8 text-slate-300">
            {/* Section 1 */}
            <section className="border-t border-slate-800/60 pt-6">
              <h2 className="text-xl font-bold text-slate-100 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full bg-cyan-500" />
                Information We Collect
              </h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                When you connect your Instagram account to our service, we may collect and securely store the following data:
              </p>
              <ul className="space-y-2.5 pl-2">
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Instagram Account ID:</strong> To link automations to the correct account profile.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Instagram Username:</strong> Displayed on your user dashboard for management.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Access Tokens:</strong> Tokens provided through Meta's OAuth system to authenticate and perform automation actions.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Automation Settings:</strong> Specific configuration options, keyword triggers, and custom replies.</span>
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="border-t border-slate-800/60 pt-6">
              <h2 className="text-xl font-bold text-slate-100 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full bg-indigo-500" />
                How We Use Information
              </h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                We use the collected information strictly for service operations:
              </p>
              <ul className="space-y-2 pl-2">
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span>Connect and synchronize your Instagram professional profiles.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span>Process automations and keyword-matching configurations set by you.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span>Deliver automated replies to comments and direct messages in accordance with your settings.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span>Monitor and improve our service's reliability and response times.</span>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="border-t border-slate-800/60 pt-6">
              <h2 className="text-xl font-bold text-slate-100 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full bg-purple-500" />
                Data Security
              </h2>
              <p className="text-slate-400 leading-relaxed">
                We implement industry-standard encryption and security measures to guard your stored account credentials, secrets, and configuration preferences from unauthorized access, disclosure, or alteration.
              </p>
            </section>

            {/* Section 4 */}
            <section className="border-t border-slate-800/60 pt-6">
              <h2 className="text-xl font-bold text-slate-100 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full bg-pink-500" />
                Third-Party Services
              </h2>
              <p className="text-slate-400 leading-relaxed">
                InstaFlow leverages official Meta (Facebook and Instagram Graph) APIs to handle authentication and deliver comments/messages replies. Any data shared with Meta is subject to the <a href="https://www.facebook.com/policy.php" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Meta Privacy Policy</a>.
              </p>
            </section>

            {/* Section 5 */}
            <section className="border-t border-slate-800/60 pt-6">
              <h2 className="text-xl font-bold text-slate-100 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full bg-emerald-500" />
                Contact Us
              </h2>
              <p className="text-slate-400 leading-relaxed flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                For any questions or support requests concerning this policy, please reach out to:{" "}
                <a href="mailto:techwithkesava@gmail.com" className="text-cyan-400 hover:underline">
                  techwithkesava@gmail.com
                </a>
              </p>
            </section>

            {/* Section 6 */}
            <section className="border-t border-slate-800/60 pt-6">
              <h2 className="text-xl font-bold text-slate-100 mb-3 flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full bg-amber-500" />
                Changes to This Policy
              </h2>
              <p className="text-slate-400 leading-relaxed">
                This Privacy Policy may be updated periodically. We will notify you of major changes by updating the last updated timestamp at the top of this page.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900/60 py-6 text-center z-10 bg-slate-950/20">
        <p className="text-xs text-slate-500">
          © 2026 InstaFlow Auto DM. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
