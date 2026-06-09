import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiLayers,
  FiZap,
} from "react-icons/fi";
import { ServerUrl } from "../App";

const RAZORPAY_SCRIPT_ID = "razorpay-checkout-script";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById(RAZORPAY_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function Billing({ user }) {
  const navigate = useNavigate();
  const currentUser = user?.user ?? user ?? {};
  const [isLaunchingCheckout, setIsLaunchingCheckout] = useState(false);

  const plan = String(currentUser?.plan || "free").toLowerCase();
  const requestLimit = Number(currentUser?.requestlimit || 0);
  const totalMessages = Number(currentUser?.totalmessages || 0);
  const remainingRequests = Math.max(0, requestLimit - totalMessages);
  const remainingDays = currentUser?.proexpireat
    ? Math.max(
        0,
        Math.ceil(
          (new Date(currentUser.proexpireat).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;
  const geminiStatus = String(currentUser?.geministatus || "active").toLowerCase();
  const geminiEnabled = Boolean(currentUser?.geminiapikey);
  const isSetupComplete = Boolean(currentUser?.issetupcomplete);

  const packageLabel = useMemo(() => {
    if (plan === "enterprise") {
      return "Enterprise package";
    }
    if (plan === "pro") {
      return "Pro package";
    }
    return "Free package";
  }, [plan]);

  useEffect(() => {
    if (currentUser?._id && !isSetupComplete) {
      toast.error("Please complete the builder setup first.");
      navigate("/builder", { replace: true });
    }
  }, [currentUser?._id, isSetupComplete, navigate]);

  const statusTone =
    geminiStatus === "active"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : geminiStatus === "quota_exceeded"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : "border-rose-400/20 bg-rose-400/10 text-rose-200";

  const planTone =
    plan === "enterprise"
      ? "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200"
      : plan === "pro"
        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
        : "border-white/10 bg-white/5 text-slate-200";

  const cards = [
    {
      label: "Current plan",
      value: plan.charAt(0).toUpperCase() + plan.slice(1),
      note: "This is the active subscription tier on the account.",
      icon: FiLayers,
    },
    {
      label: "Purchased package",
      value: packageLabel,
      note: `${requestLimit || 0} response limit included in the current package.`,
      icon: FiCreditCard,
    },
    {
      label: "Remaining days",
      value: remainingDays === null ? "No expiry" : `${remainingDays} day${remainingDays === 1 ? "" : "s"}`,
      note: currentUser?.proexpireat ? `Expires on ${new Date(currentUser.proexpireat).toLocaleDateString()}` : "No active expiry date for this plan.",
      icon: FiCalendar,
    },
    {
      label: "Gemini status",
      value: geminiStatus.replace(/_/g, " "),
      note: geminiEnabled ? "Gemini API key is connected for this account." : "No Gemini API key connected.",
      icon: FiZap,
    },
  ];

  const verifyAndActivate = useCallback(
    async (payload) => {
      await axios.post(`${ServerUrl}/api/billing/verify`, payload, {
        withCredentials: true,
      });
      toast.success("Payment verified. Pro plan activated.");
      window.location.reload();
    },
    [],
  );

  const handleProPurchase = useCallback(async () => {
    if (!isSetupComplete) {
      toast.error("Complete the builder setup before purchasing a plan.");
      navigate("/builder");
      return;
    }

    if (plan === "pro") {
      toast.success("You are already on the Pro plan.");
      return;
    }

    setIsLaunchingCheckout(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Unable to load Razorpay checkout.");
        return;
      }

      const { data } = await axios.post(
        `${ServerUrl}/api/billing/order`,
        { plan: "pro" },
        { withCredentials: true },
      );

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: currentUser?.businessname || "Shifra AI",
        description: "Upgrade to Pro plan",
        order_id: data.order.id,
        prefill: {
          name: currentUser?.name || "User",
          email: currentUser?.email || "",
        },
        theme: {
          color: "#22d3ee",
        },
        handler: async (response) => {
          await verifyAndActivate({
            orderid: response.razorpay_order_id,
            paymentid: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            toast("Payment closed.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        toast.error(response?.error?.description || "Payment failed.");
      });
      razorpay.open();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Unable to start payment.");
    } finally {
      setIsLaunchingCheckout(false);
    }
  }, [currentUser?.businessname, currentUser?.email, currentUser?.name, isSetupComplete, navigate, plan, verifyAndActivate]);

  if (currentUser?._id && !isSetupComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#020617_0%,#08111f_42%,#020617_100%)] px-4 text-white">
        <div className="max-w-xl rounded-[1.9rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_90px_rgba(2,6,23,0.28)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
            Billing locked
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Complete your builder setup first.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Billing and plan purchase are available only after you finish the assistant builder.
          </p>
          <button
            type="button"
            onClick={() => navigate("/builder")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Go to builder
            <FiArrowRight />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(232,121,249,0.14),transparent_26%),linear-gradient(180deg,#020617_0%,#08111f_42%,#020617_100%)] text-white">
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[64px_64px]" />

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Billing</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Account plan and usage overview.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              Track your current plan, purchased package, remaining days, response usage, and Gemini connection status from one dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to home
            </button>
            <button
              type="button"
              onClick={() => navigate("/builder")}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Open builder
              <FiArrowRight />
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.22)] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
                    <div className="mt-3 text-2xl font-black text-white">{card.value}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-200">
                    <Icon className="text-xl" />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{card.note}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[1.9rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Usage</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Response consumption</h2>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${planTone}`}>
                {plan}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total used</div>
                <div className="mt-2 text-3xl font-black text-white">{totalMessages}</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Remaining</div>
                <div className="mt-2 text-3xl font-black text-white">{remainingRequests}</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Limit</div>
                <div className="mt-2 text-3xl font-black text-white">{requestLimit}</div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(59,130,246,0.08))] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
                  <FiClock />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Plan expiry</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {currentUser?.proexpireat
                      ? `Your ${planLabel(plan)} plan is active until ${new Date(currentUser.proexpireat).toLocaleDateString()}.`
                      : `No expiry date is set for the current ${planLabel(plan)} plan.`}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-200">
                <FiCheckCircle />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Gemini</p>
                <h2 className="mt-1 text-xl font-bold text-white">API status</h2>
              </div>
            </div>

            <div className={`mt-5 rounded-3xl border px-4 py-4 ${statusTone}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-90">Current status</div>
              <div className="mt-2 text-2xl font-black capitalize">{geminiStatus.replace(/_/g, " ")}</div>
              <p className="mt-2 text-sm leading-6 opacity-90">
                {geminiEnabled
                  ? "A Gemini API key is connected to this account and can power assistant responses."
                  : "No Gemini API key is connected yet, so responses will use the fallback assistant behavior."}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Plan package</div>
                <div className="mt-2 text-lg font-bold text-white">{packageLabel}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Remaining days</div>
                <div className="mt-2 text-lg font-bold text-white">
                  {remainingDays === null ? "No expiry set" : `${remainingDays} day${remainingDays === 1 ? "" : "s"}`}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Account plan</div>
                <div className="mt-2 text-lg font-bold text-white capitalize">{plan}</div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-8 lg:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Plans</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Choose your package</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Compare the available plans and keep the active subscription highlighted for a clean billing experience.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                {plan === "free" ? "On free plan" : `On ${plan} plan`}
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div
                className={`relative overflow-hidden rounded-[1.75rem] border p-6 ${plan === "free" ? "border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.14),rgba(255,255,255,0.05))]" : "border-white/10 bg-slate-950/45"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                      Starter
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">Free Plan</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Good for testing the assistant, browsing the dashboard, and handling light usage.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-200">
                    Free
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    "200 AI responses included",
                    "Basic assistant preview",
                    "Dashboard + billing access",
                    "Voice input enabled",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                      <FiCheckCircle className="text-cyan-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  {plan === "free" ? "Your current active plan." : "This plan is available for comparison only."}
                </div>
              </div>

              <div
                className={`relative overflow-hidden rounded-[1.75rem] border p-6 ${plan === "pro" ? "border-fuchsia-400/25 bg-[linear-gradient(180deg,rgba(232,121,249,0.14),rgba(255,255,255,0.05))]" : "border-white/10 bg-slate-950/45"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-200/80">
                      Recommended
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">Pro Plan</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Best for production usage with higher limits, active billing, and Gemini-powered responses.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-2 text-sm font-semibold text-fuchsia-200">
                    Pro
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    `${requestLimit > 200 ? requestLimit : 1000}+ responses depending on your package`,
                    "Higher usage for active assistants",
                    "Priority-ready billing view",
                    "Gemini-powered responses",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                      <FiCheckCircle className="text-fuchsia-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleProPurchase}
                  disabled={isLaunchingCheckout || plan === "pro"}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${plan === "pro" ? "bg-fuchsia-400 text-slate-950 hover:bg-fuchsia-300" : "bg-white text-slate-950 hover:bg-slate-100"}`}
                >
                  {isLaunchingCheckout
                    ? "Opening checkout..."
                    : plan === "pro"
                      ? "Current plan"
                      : "Pay with Razorpay"}
                </button>

                <div className="mt-3 text-xs leading-5 text-slate-400">
                  Payment will activate the Pro plan after successful Razorpay verification.
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function planLabel(plan) {
  if (plan === "enterprise") {
    return "enterprise";
  }
  if (plan === "pro") {
    return "pro";
  }
  return "free";
}

export default Billing;