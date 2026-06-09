import React, { useMemo, useState } from "react";
import AssistantPreview from "../components/AssistantPreview";
import { toast } from "react-hot-toast";
import axios from "axios";
import { ServerUrl } from "../App";

const themes = ["dark", "light"];
const tones = ["Formal", "Informal", "Friendly", "Professional"];
const normalizeTheme = (value) =>
  String(value || "").toLowerCase() === "light" ? "light" : "dark";
const toDatabaseTheme = (value) => (value === "light" ? "Light" : "Dark");

function Builder({ user = {} }) {
  const currentUser = user?.user ?? user;
  const ClientUrl = import.meta.env.VITE_CLIENT_URL || window.location.origin;

  const [editassistant, setEditAssistant] = useState(!currentUser.issetupcomplete);
  const [assistantName, setAssistantName] = useState(
    currentUser.assistantname || "Voice Concierge",
  );
  const [businessName, setBusinessName] = useState(
    currentUser.businessname || "Shifra AI",
  );
  const [businessType, setBusinessType] = useState(
    currentUser.businesstype || "Voice AI Assistant",
  );
  const [businessDescription, setBusinessDescription] = useState(
    currentUser.businessdescription ||
      "Build an assistant that can answer questions, qualify leads, and hand off conversations.",
  );
  const [tone, setTone] = useState(currentUser.tone || "Professional");
  const [theme, setTheme] = useState(normalizeTheme(currentUser.theme));
  const [geminiApiKey, setGeminiApiKey] = useState(currentUser.geminiapikey || "");
  const [pageName, setPageName] = useState("");
  const [plan, setPlan] = useState(currentUser?.plan || "free");
  const [planQuota, setPlanQuota] = useState(currentUser?.requestlimit || 1000);
  const [planExpiry, setPlanExpiry] = useState(
    currentUser?.proexpireat ? String(currentUser.proexpireat).slice(0, 10) : "",
  );
  const [pageUrl, setPageUrl] = useState("");
  const [pagePath, setPagePath] = useState("");
  const [pageKeywordsText, setPageKeywordsText] = useState("");
  const [pages, setPages] = useState([
    { name: "Home", url: "/", path: "home", keywords: ["welcome", "overview"] },
    {
      name: "Builder",
      url: "/builder",
      path: "builder",
      keywords: ["configure", "preview"],
    },
  ]);

  const pageSummary = useMemo(
    () => ({
      assistantName,
      businessName,
      businessType,
      businessDescription,
      tone,
      theme,
      pages,
    }),
    [
      assistantName,
      businessDescription,
      businessName,
      businessType,
      pages,
      theme,
      tone,
    ],
  );

  const assistantId = currentUser?._id || "your-assistant-id";
  const escapedAssistantName = String(assistantName || "Voice Concierge").replace(/"/g, "&quot;");
  const embedScriptUrl = `${ClientUrl}/assistant.js`;

  const embedCodeSnippet = useMemo(
    () =>
      [
        "<!-- Shifra Voice AI embed -->",
        "<script",
        `  src=\"${embedScriptUrl}\"`,
        `  data-user-id=\"${assistantId}\"`,
        `  data-api-base=\"${ServerUrl}\"`,
        `  data-assistant-name=\"${escapedAssistantName}\"`,
        `  data-theme=\"${theme}\"`,
        '  data-position="bottom-right"',
        "  defer",
        "></script>",
      ].join("\n"),
    [assistantId, embedScriptUrl, escapedAssistantName, theme],
  );

  const reactExampleSnippet = useMemo(
    () =>
      [
        'import { useEffect } from "react";',
        "",
        "export default function VoiceAgent() {",
        "  useEffect(() => {",
        "    const script = document.createElement('script');",
        `    script.src = \"${embedScriptUrl}\";`,
        "    script.async = true;",
        "    script.defer = true;",
        `    script.dataset.userId = \"${assistantId}\";`,
        `    script.dataset.apiBase = \"${ServerUrl}\";`,
        `    script.dataset.theme = \"${theme}\";`,
        "    script.dataset.position = \"bottom-right\";",
        "    document.body.appendChild(script);",
        "",
        "    return () => {",
        "      document.body.removeChild(script);",
        "    };",
        "  }, []);",
        "",
        "  return null;",
        "}",
      ].join("\n"),
    [assistantId, embedScriptUrl, theme],
  );

  const copyToClipboard = async (text, label) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      toast.success(`${label} copied`);
    } catch (error) {
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  };

  const addPage = () => {
    const trimmedName = pageName.trim();
    const trimmedUrl = pageUrl.trim();
    const trimmedPath = pagePath.trim();
    const keywords = pageKeywordsText
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    if (!trimmedName || !trimmedUrl || !trimmedPath) {
      alert("Please fill the page name, URL, and path.");
      return;
    }

    setPages((currentPages) => [
      ...currentPages,
      {
        name: trimmedName,
        url: trimmedUrl,
        path: trimmedPath.replace(/^\/+/, ""),
        keywords,
      },
    ]);

    setPageName("");
    setPageUrl("");
    setPagePath("");
    setPageKeywordsText("");
  };

  const removePage = (indexToRemove) => {
    setPages((currentPages) =>
      currentPages.filter((_, index) => index !== indexToRemove),
    );
  };
  const saveAssistant = async () => {
    try {
      const page = pages.map(({ name, path, keywords }) => ({
        name,
        path,
        keywords,
      }));
      const payload = {
        assistantname: assistantName,
        businessname: businessName,
        businesstype: businessType,
        businessdescription: businessDescription,
        tone,
        theme: toDatabaseTheme(theme),
        plan,
        planQuota,
        planExpiry: planExpiry || null,
        geminiapikey: geminiApiKey || null,
        page,
      };
      const response = await axios.post(
        ServerUrl + "/api/user/save-assistant",
        payload,
        {
          withCredentials: true,
        },
      );
      setEditAssistant(false);
      toast.success(
        response.data.message || "Assistant published successfully",
      );
    } catch (error) {
      toast.error(
        `Failed to publish assistant: ${error.response?.data?.message || error.message}`,
      );
    }
  };
  const getRemainingRequests = () =>
    Math.max(0, (currentUser?.requestlimit || 0) - (currentUser?.totalmessages || 0));

  const getRequestsSpent = () => Math.max(0, currentUser?.totalmessages || 0);

  const getRemainingDays = () => {
    if (!currentUser?.proexpireat) {
      return "—";
    }

    return Math.max(
      0,
      Math.ceil((new Date(currentUser.proexpireat).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
  };
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(232,121,249,0.12),transparent_26%),linear-gradient(180deg,#020617_0%,#08111f_42%,#020617_100%)] text-white">
      <div className="absolute inset-0 opacity-35 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[64px_64px]" />

      <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
            Builder
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Build your assistant in a clean, vertical workspace.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            Fill in the fields from top to bottom, map your navigation pages,
            connect your API key, and use the live preview below to verify the
            experience.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { value: `${pages.length}`, label: "Pages mapped" },
            { value: tone, label: "Tone selected" },
            { value: theme, label: "Theme selected" },
            { value: plan.charAt(0).toUpperCase() + plan.slice(1), label: "Current plan" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl"
            >
              <div className="text-2xl font-black text-white">{item.value}</div>
              <div className="mt-1 text-sm text-slate-400">{item.label}</div>
            </div>
          ))}
        </div>

        {editassistant ? (
          <div className="mt-8 space-y-6">
          <section className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  Project setup
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Define the core identity of the assistant.
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Live sync
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Assistant name
                </span>
                <input
                  type="text"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="Voice Concierge"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Business name
                </span>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Shifra AI"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Business type
                </span>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="Voice AI Assistant"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Current theme
                </span>
                <input
                  type="text"
                  value={theme}
                  readOnly
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 outline-none"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Current plan
                </span>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none sm:w-auto"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={planQuota}
                    onChange={(e) => setPlanQuota(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none sm:w-32"
                    placeholder="Quota"
                    title="Monthly quota"
                  />
                </div>
                <input
                  type="date"
                  value={planExpiry}
                  onChange={(e) => setPlanExpiry(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none"
                />
                <p className="mt-2 text-xs text-slate-400">Set quota and expiry for this plan (preview only).</p>
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Business description
              </span>
              <textarea
                rows={5}
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Describe what your assistant should do and how it should behave."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
              />
            </label>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Theme
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {themes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTheme(item)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${theme === item ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
                    >
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Tone
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {tones.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTone(item)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${tone === item ? "border-fuchsia-300/60 bg-fuchsia-400/15 text-fuchsia-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  Navigation builder
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Add website pages, full paths, and keywords for the assistant.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                URL path + keywords
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Page name
                </span>
                <input
                  type="text"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  placeholder="Pricing"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Full URL
                </span>
                <input
                  type="text"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  placeholder="https://example.com/pricing"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Path slug
                </span>
                <input
                  type="text"
                  value={pagePath}
                  onChange={(e) => setPagePath(e.target.value)}
                  placeholder="pricing"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Keywords
                </span>
                <input
                  type="text"
                  value={pageKeywordsText}
                  onChange={(e) => setPageKeywordsText(e.target.value)}
                  placeholder="pricing, plans, costs"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={addPage}
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-300"
              >
                Add page
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {pages.map((page, index) => (
                <div
                  key={`${page.path}-${index}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-white">
                          {page.name}
                        </h3>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                          /{page.path}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{page.url}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {page.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removePage(index)}
                      className="rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  Integration
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Connect Gemini and keep the assistant ready for real usage.
                </p>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Get API key
              </a>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Gemini API key
                </span>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter Gemini API key"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10"
                />
              </label>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                Stored locally in this builder preview.
              </div>
            </div>
          </section>

          <section className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  Code examples and embed
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Copy a ready-to-use script or React example and paste it in your application.
                </p>
              </div>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Copy + paste
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                      Embed script
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Paste this before the closing body tag in your website HTML.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(embedCodeSnippet, "Embed code")}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                  >
                    Copy
                  </button>
                </div>
                <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-slate-200">
                  <code>{embedCodeSnippet}</code>
                </pre>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200/80">
                      React example
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Use this component pattern to mount and unmount the voice agent.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(reactExampleSnippet, "React example")}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                  >
                    Copy
                  </button>
                </div>
                <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-slate-200">
                  <code>{reactExampleSnippet}</code>
                </pre>
              </div>
            </div>
          </section>

          <section className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  Publish actions
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Use these controls when you are ready to continue.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() =>
                  toast.success("Assistant draft saved successfully")
                }
                className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 sm:w-auto"
              >
                Save draft
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                Preview changes
              </button>
              <button
                type="button"
                onClick={saveAssistant}
                className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20 sm:w-auto"
              >
                Publish assistant
              </button>
            </div>
          </section>
        </div>
        ) : (
          <section className="mt-8 overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] shadow-[0_35px_110px_rgba(2,6,23,0.35)] backdrop-blur-xl">
            <div className="border-b border-white/10 px-5 py-5 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/90">
                Assistant saved
              </p>
              <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                    Your assistant is live and ready.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                    The builder form is hidden after publish so the saved version feels like a real dashboard. You can reopen it any time to edit details.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setEditAssistant(true)}
                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    Edit assistant
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.success("Assistant is already published")}
                    className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    View status
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:px-8 lg:py-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.2)] sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-cyan-400/15 ring-1 ring-cyan-300/20" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
                      Assistant
                    </p>
                    <h3 className="mt-1 text-2xl font-bold text-white">
                      {assistantName}
                    </h3>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                  {businessDescription}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">
                    {businessName}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 capitalize">
                    {plan}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 capitalize">
                    {tone}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 capitalize">
                    {theme}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Requests spent", value: getRequestsSpent() },
                    { label: "Requests remaining", value: getRemainingRequests() },
                    { label: "Remaining days", value: getRemainingDays() },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4"
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {item.label}
                      </div>
                      <div className="mt-2 text-2xl font-black text-white">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Current plan
                  </p>
                  <div className="mt-2 text-2xl font-black capitalize text-white">
                    {plan}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">Quota: {planQuota} / month</p>
                  <p className="mt-1 text-sm text-slate-400">Expiry: {planExpiry || "—"}</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Gemini status
                  </p>
                  <div className="mt-2 text-2xl font-black text-white capitalize">
                    {currentUser.geministatus || "unknown"}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {currentUser.geministatus === "active"
                      ? "Your Gemini API key is active and ready to use."
                      : currentUser.geministatus === "inactive"
                        ? "Your Gemini API key is inactive. Please check your key and try again."
                        : "Your Gemini API key has exceeded its quota. Please wait for the quota to reset or use a different key."}
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/90">
                    Usage snapshot
                  </p>
                  <p className="mt-2 text-sm leading-7 text-emerald-50/85">
                    {getRequestsSpent()} requests used and {getRemainingRequests()} left in the current cycle.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Embed code
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Copy this script and paste it before the closing body tag in your HTML file.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(embedCodeSnippet, "Embed code")}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                    >
                      Copy
                    </button>
                  </div>

                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs leading-6 text-slate-200">
                    <code>{embedCodeSnippet}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default Builder;
