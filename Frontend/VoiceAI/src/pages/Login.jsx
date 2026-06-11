import React from "react";
import {
  HiOutlineSparkles,
  HiOutlineMicrophone,
  HiOutlineCode,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase";
import axios from "axios";
import { ServerUrl } from "../App";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function Login({ setuser }) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const features = [
    {
      icon: <HiOutlineMicrophone className="text-xl" />,
      title: "Voice controls",
      desc: "Let users interact naturally with speech.",
    },
    {
      icon: <HiOutlineSparkles className="text-xl" />,
      title: "Smart guidance",
      desc: "Guide users with clean, helpful prompts.",
    },
    {
      icon: <HiOutlineCode className="text-xl" />,
      title: "Easy embed",
      desc: "Drop this experience into any app quickly.",
    },
    {
      icon: <HiOutlineLightningBolt className="text-xl" />,
      title: "Fast and responsive",
      desc: "Looks good on mobile, tablet, and desktop.",
    },
  ];

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const { displayName, email } = result.user;
      const responses = await axios.post(
        ServerUrl + "/api/auth/google",
        { name: displayName, email },
        { withCredentials: true },
      );
      setuser(responses.data);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (error) {
      toast.error("Login failed");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(167,139,250,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2">
          <section className="relative order-2 overflow-hidden rounded-4xl border border-white/60 bg-white/70 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur xl:p-10">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-purple-300/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />

            <div className="relative">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700">
                <HiOutlineSparkles />
                AI Voice Assistant Platform
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Sign in to your account
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  Access your dashboard, manage your assistant, and continue
                  building fast AI voice experiences.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
              >
                <FcGoogle className="text-2xl" />
                {loading ? "Signing in..." : "Continue with Google"}
              </button>
              <p className=""> Free plan includes 200 AI responses</p>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or use your email
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                    />
                    Remember me
                  </label>
                  <a
                    href="#"
                    className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
                  >
                    Forgot password?
                  </a>
                </div>

                <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 sm:text-base">
                  Sign in
                </button>

                <p className="text-center text-sm text-slate-600">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={loading}
                    className="font-semibold text-purple-700 transition hover:text-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Create one with Google
                  </button>
                </p>
              </form>
            </div>
          </section>

          <aside className="order-1 lg:order-2">
            <div className="rounded-4xl bg-slate-950 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.28)] sm:p-10">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Built for modern voice apps
              </div>

              <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl">
                A clean login screen that scales beautifully.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                This layout keeps your sign-in flow focused while still showing
                the value of your AI voice platform.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <div className="mb-3 inline-flex rounded-xl bg-white/10 p-3 text-emerald-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-base font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Login;
