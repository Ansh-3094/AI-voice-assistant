import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiMic, FiShield, FiZap, FiUsers } from "react-icons/fi";
import AssistantPreview from "../components/AssistantPreview";

function Home({ user }) {
    const navigate = useNavigate();
    const currentUser = user?.user ?? user;
    const previewApiBase = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

    const highlights = [
        {
            icon: FiMic,
            title: "Natural voice control",
            desc: "Design voice-first flows that feel fast, conversational, and intuitive.",
        },
        {
            icon: FiZap,
            title: "Instant assistant setup",
            desc: "Build and deploy assistant experiences with a clean production workflow.",
        },
        {
            icon: FiShield,
            title: "Reliable by design",
            desc: "Structured auth, protected routes, and a modern interface you can scale.",
        },
    ];

    const metrics = [
        { value: "99.9%", label: "Uptime-ready architecture" },
        { value: "24/7", label: "Assistant availability" },
        { value: "3x", label: "Faster setup flow" },
    ];

    return (
        <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(232,121,249,0.14),transparent_26%),linear-gradient(180deg,#020617_0%,#08111f_42%,#020617_100%)] text-white">
            <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[64px_64px]" />

            <section className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                    <div>
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                            Enterprise-grade voice assistant platform
                        </div>

                        <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
                            Build a premium voice AI experience that feels ready for production.
                        </h1>

                        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                            Welcome back{currentUser?.name ? `, ${currentUser.name}` : ""}. Manage your assistant, review billing,
                            and launch a responsive customer-facing experience from one polished dashboard.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => navigate("/builder")}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.35)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
                            >
                                Open Builder
                                <FiArrowRight />
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate(currentUser?.issetupcomplete ? "/billing" : "/builder")}
                                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
                            >
                                View Billing
                            </button>
                        </div>

                        <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 backdrop-blur-sm">
                            Free plan includes 200 AI responses.
                        </div>

                        <div className="mt-10 grid gap-4 sm:grid-cols-3">
                            {metrics.map((metric) => (
                                <div
                                    key={metric.label}
                                    className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                                >
                                    <div className="text-2xl font-black text-white">{metric.value}</div>
                                    <div className="mt-1 text-sm text-slate-400">{metric.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-cyan-400/20 blur-3xl" />
                        <div className="absolute -bottom-8 right-0 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl" />

                        <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-white/5 p-5 shadow-[0_30px_90px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:p-6">
                            <div className="rounded-3xl border border-cyan-400/15 bg-slate-950/70 p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">VoiceAI Dashboard</p>
                                        <h2 className="mt-2 text-2xl font-bold text-white">Smart assistant overview</h2>
                                    </div>
                                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                        Live
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    {highlights.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <div className="mb-3 inline-flex rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-200">
                                                    <Icon className="text-xl" />
                                                </div>
                                                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                                                <p className="mt-2 text-sm leading-6 text-slate-400">{item.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 rounded-2xl border border-fuchsia-400/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(232,121,249,0.08))] p-4 sm:p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                                            <FiUsers className="text-2xl text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">User profile</p>
                                            <p className="mt-1 text-lg font-semibold text-white">{currentUser?.name || "Guest user"}</p>
                                            <p className="text-sm text-slate-300">{currentUser?.email || "No email available"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <AssistantPreview
                compact
                userId={currentUser?._id || ""}
                apiBase={previewApiBase}
                assistantName={currentUser?.assistantname || "Voice Concierge"}
                businessName={currentUser?.businessname || "Your business"}
                businessType={currentUser?.businesstype || "Voice AI platform"}
                businessDescription={currentUser?.businessdescription || "Design and test a polished voice assistant experience before launch."}
                tone={currentUser?.tone || "Professional"}
                theme={String(currentUser?.theme || "dark").toLowerCase() === "light" ? "light" : "dark"}
                pages={currentUser?.page || []}
            />

            <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-8 lg:p-10">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Quick start</p>
                        <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Follow these steps to use the app</h2>
                        <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
                            Start in Home, open the builder, test your assistant, and then move to billing when you are ready to scale.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 lg:grid-cols-4">
                        {[
                            {
                                step: "01",
                                title: "Sign in",
                                text: "Use your Google account to access the dashboard and load your profile.",
                            },
                            {
                                step: "02",
                                title: "Open Builder",
                                text: "Go to the builder to preview the assistant experience and check the flow.",
                            },
                            {
                                step: "03",
                                title: "Test the assistant",
                                text: "Run through a sample conversation, adjust the prompt, and verify the handoff.",
                            },
                            {
                                step: "04",
                                title: "Launch and monitor",
                                text: "Review billing, monitor usage, and ship the experience when it feels ready.",
                            },
                        ].map((item) => (
                            <div key={item.step} className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">Step {item.step}</span>
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Home