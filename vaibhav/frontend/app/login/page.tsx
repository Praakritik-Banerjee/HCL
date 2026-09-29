"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLearner } from "@/context/LearnerContext";
import { apiService } from "@/services/api";
import { Mail, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useLearner();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginTab) {
        const res = await apiService.login(email, password);
        loginUser({
          id: res.id,
          email: res.email,
          full_name: res.full_name,
          learner_id: res.learner_id,
          access_token: res.access_token,
        });
        router.push("/");
      } else {
        if (!fullName.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }
        const res = await apiService.register(email, password, fullName);
        loginUser({
          id: res.id,
          email: res.email,
          full_name: res.full_name,
          learner_id: res.learner_id,
          access_token: res.access_token,
        });
        router.push("/");
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || "Authentication failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1410] text-warm-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 shadow-xl shadow-primary-500/15 mb-4">
            <span className="text-warm-950 font-extrabold text-xl font-display">P</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-warm-100 mb-2 font-display">
            PadhaiMate
          </h1>
          <p className="text-warm-500 text-sm">
            Personalized Learning Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-2xl border border-warm-800/30 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-warm-950/80 rounded-xl p-1 mb-6 border border-warm-800/20">
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isLoginTab
                  ? "bg-primary-500 text-warm-950 shadow"
                  : "text-warm-500 hover:text-warm-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isLoginTab
                  ? "bg-primary-500 text-warm-950 shadow"
                  : "text-warm-500 hover:text-warm-200"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginTab && (
              <div>
                <label className="block text-xs font-medium text-warm-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-warm-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-warm-950/80 border border-warm-800/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-warm-100 placeholder-warm-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-warm-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-warm-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full bg-warm-950/80 border border-warm-800/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-warm-100 placeholder-warm-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-warm-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-warm-950/80 border border-warm-800/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-warm-100 placeholder-warm-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-400 hover:from-primary-500 hover:to-primary-300 text-warm-950 font-semibold rounded-xl text-xs shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>{isLoginTab ? "Sign In to PadhaiMate" : "Create PadhaiMate Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-xs text-warm-600 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-emerald" />
          <span>Secured with PostgreSQL & Privacy Shield</span>
        </div>
      </div>
    </div>
  );
}
