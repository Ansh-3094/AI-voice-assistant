import React from "react";
import {
    FiArrowUpRight,
    FiCheckCircle,
    FiClock,
    FiMic,
    FiMoreHorizontal,
    FiPause,
    FiPhoneCall,
    FiSettings,
} from "react-icons/fi";

const themes = {
   dark: {
    shell: "bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(232,121,249,0.12),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-white",
      overlay: "bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]",
      card: "border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(2,6,23,0.55)]",
      borderGlow: "border-cyan-400/20 shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_0_40px_rgba(34,211,238,0.14)]",
      text: "text-white",
      sub: "text-slate-300",
      listening: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
      badge: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
      micGlow: "shadow-[0_0_28px_rgba(34,211,238,0.28)]",
      orbOne: "bg-cyan-400/25",
    orbTwo: "bg-fuchsia-500/20",
      btnPrimary: "bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.32)] hover:bg-cyan-300",
      btnSecondary: "border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10",
      wave: "bg-cyan-300",
   },
   light: {
    shell: "bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-950",
      overlay: "bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.18))]",
      card: "border-slate-200/80 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.10)]",
      borderGlow: "border-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.14),0_0_40px_rgba(59,130,246,0.10)]",
      text: "text-slate-950",
      sub: "text-slate-600",
      listening: "border-emerald-200 bg-emerald-50 text-emerald-700",
      badge: "border-sky-200 bg-sky-50 text-sky-700",
      micGlow: "shadow-[0_0_28px_rgba(59,130,246,0.18)]",
      orbOne: "bg-sky-300/40",
    orbTwo: "bg-emerald-300/30",
      btnPrimary: "bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] hover:bg-slate-800",
      btnSecondary: "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      wave: "bg-sky-500",
   },
};

function AssistantPreview({
    compact = false,
    assistantName = "Voice Concierge",
    businessName = "Your business",
    businessType = "Voice AI platform",
    businessDescription = "Design and test a polished voice assistant experience before launch.",
    tone = "Professional",
    theme = "dark",
    pages = [],
    apiBase = "http://localhost:5000",
    userId = "",
}) {
    const pickSpeechLanguage = React.useCallback(() => {
        const languages = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language || "en-US"];
        const preferred = String(languages[0] || "en-US").toLowerCase();
        if (preferred.startsWith("hi")) {
            return "hi-IN";
        }
        if (preferred.startsWith("gu")) {
            return "gu-IN";
        }
        return preferred || "en-US";
    }, []);

    const [previewTheme, setPreviewTheme] = React.useState(theme);
    const [listening, setListening] = React.useState(false);
    const [userSpeaking, setUserSpeaking] = React.useState(false);
    const [liveTranscript, setLiveTranscript] = React.useState("");
    const [speechSupported, setSpeechSupported] = React.useState(true);
    const [questionInput, setQuestionInput] = React.useState("");
    const [isRequesting, setIsRequesting] = React.useState(false);
    const [lastQuestion, setLastQuestion] = React.useState("");
    const [voiceStatus, setVoiceStatus] = React.useState("Tap Start listening to speak.");
    const currentTheme = themes[previewTheme];

    const initialMessages = [
        {
            role: "assistant",
            title: "Assistant",
            text: "Hi. Ask me a question by voice or text and I will answer from your backend assistant.",
        },
    ];
    const [messages, setMessages] = React.useState(initialMessages);
    const recognitionRef = React.useRef(null);
    const messagesContainerRef = React.useRef(null);

    const appendMessage = React.useCallback((role, text) => {
        const content = String(text || "").trim();
        if (!content) {
            return;
        }
        setMessages((prev) => [
            ...prev,
            {
                role,
                title: role === "user" ? "User" : "Assistant",
                text: content,
            },
        ]);
    }, []);

    const navigateToTarget = React.useCallback((navigation) => {
        if (!navigation?.target) {
            return false;
        }

        const targetUrl = new URL(navigation.target, window.location.origin).toString();
        setVoiceStatus(`Navigating to ${navigation.pageName || navigation.target}...`);
        window.setTimeout(() => {
            window.location.assign(targetUrl);
        }, 300);
        return true;
    }, []);

    const speakReplyAndNavigate = React.useCallback((reply, navigation) => {
        if (!navigation?.target) {
            return false;
        }

        const targetUrl = new URL(navigation.target, window.location.origin).toString();
        const performNavigation = () => {
            setVoiceStatus(`Navigating to ${navigation.pageName || navigation.target}...`);
            window.location.assign(targetUrl);
        };

        const SpeechSynthesisUtteranceCtor = window.SpeechSynthesisUtterance;
        if (!SpeechSynthesisUtteranceCtor || !window.speechSynthesis || !reply) {
            window.setTimeout(performNavigation, 300);
            return true;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtteranceCtor(reply);
        utterance.lang = pickSpeechLanguage();
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onstart = () => {
            setVoiceStatus(`Speaking reply before navigating to ${navigation.pageName || navigation.target}...`);
        };
        utterance.onend = () => {
            performNavigation();
        };
        utterance.onerror = () => {
            performNavigation();
        };

        window.speechSynthesis.speak(utterance);
        return true;
    }, [pickSpeechLanguage]);

    const submitQuestion = React.useCallback(async (
        rawQuestion,
        source = "text",
    ) => {
        const question = String(rawQuestion || "").trim();
        if (!question || isRequesting) {
            return;
        }

        appendMessage("user", question);
        setLastQuestion(question);
        setQuestionInput("");

        if (!userId) {
            setVoiceStatus("Missing user id. Please log in and open Builder once to configure assistant.");
            appendMessage("assistant", "Assistant is not configured yet. Missing user id.");
            return;
        }

        setIsRequesting(true);
        setVoiceStatus(source === "voice" ? "Sending voice question to backend..." : "Sending question to backend...");

        try {
            const response = await fetch(`${apiBase}/api/assistant/chat/${encodeURIComponent(userId)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: question,
                    history: messages,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "Backend request failed");
            }

            appendMessage("assistant", data?.reply || "No reply returned from backend.");
            if (data?.navigation?.target) {
                speakReplyAndNavigate(data?.reply || "", data.navigation);
                return;
            }

            setVoiceStatus("Backend reply received.");
        } catch (error) {
            appendMessage("assistant", "Could not reach backend. Check server, user configuration, and API key.");
            setVoiceStatus(error?.message || "Backend request failed.");
        } finally {
            setIsRequesting(false);
        }
    }, [apiBase, appendMessage, isRequesting, messages, navigateToTarget, userId]);

    const retryLastQuestion = React.useCallback(() => {
        if (!lastQuestion || isRequesting) {
            return;
        }
        submitQuestion(lastQuestion, "retry");
    }, [isRequesting, lastQuestion, submitQuestion]);

    const stopListening = React.useCallback(() => {
        if (!recognitionRef.current) {
            return;
        }
        try {
            recognitionRef.current.stop();
        } catch {
            // Ignore stop errors from inactive recognizer state.
        }
    }, []);

    const startListening = React.useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechSupported(false);
            return;
        }

        if (recognitionRef.current) {
            stopListening();
        }

        const recognition = new SpeechRecognition();
        recognition.lang = pickSpeechLanguage();
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = () => {
            setListening(true);
            setUserSpeaking(false);
            setLiveTranscript("");
            setVoiceStatus("Listening...");
        };

        recognition.onspeechstart = () => {
            setUserSpeaking(true);
            setVoiceStatus("You are speaking...");
        };

        recognition.onspeechend = () => {
            setUserSpeaking(false);
            setVoiceStatus("Processing your speech...");
        };

        recognition.onresult = (event) => {
            let interim = "";
            let finalText = "";

            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const result = event.results[i];
                const transcript = result[0]?.transcript || "";
                if (result.isFinal) {
                    finalText += `${transcript} `;
                } else {
                    interim += transcript;
                }
            }

            const interimText = interim.trim();
            setLiveTranscript(interimText || finalText.trim());

            const finalTranscript = finalText.trim();
            if (finalTranscript) {
                setLiveTranscript("");
                submitQuestion(finalTranscript, "voice");
            }
        };

        recognition.onerror = (event) => {
            setListening(false);
            setUserSpeaking(false);
            setLiveTranscript("");
            const errorType = event?.error || "unknown";
            if (errorType === "not-allowed") {
                setVoiceStatus("Microphone permission denied. Please allow mic access.");
            } else if (errorType === "no-speech") {
                setVoiceStatus("No speech detected. Try speaking louder and closer to the mic.");
            } else if (errorType === "audio-capture") {
                setVoiceStatus("No microphone found. Check your audio input device.");
            } else if (errorType === "aborted") {
                setVoiceStatus("Listening stopped.");
            } else {
                setVoiceStatus("Voice recognition failed. Please try again.");
            }
        };

        recognition.onend = () => {
            setListening(false);
            setUserSpeaking(false);
            if (!liveTranscript) {
                setVoiceStatus((prev) =>
                    prev === "You are speaking..." || prev === "Listening..."
                        ? "Tap Start listening to speak."
                        : prev,
                );
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch {
            setListening(false);
            setUserSpeaking(false);
            setVoiceStatus("Could not start microphone. Wait a moment and try again.");
        }
    }, [liveTranscript, stopListening, submitQuestion]);

    const toggleListening = React.useCallback(() => {
        if (listening) {
            stopListening();
            setVoiceStatus("Listening stopped.");
            return;
        }
        startListening();
    }, [listening, startListening, stopListening]);

    React.useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setSpeechSupported(Boolean(SpeechRecognition));
        if (!SpeechRecognition) {
            setVoiceStatus("Speech recognition is not supported in this browser. Use Chrome or Edge.");
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {
                    // Ignore cleanup stop errors.
                }
            }
        };
    }, []);

    React.useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) {
            return;
        }
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const quickActions = ["Test call", "Edit prompt", "View logs", "Deploy update"];
    const checklist = [
        { label: "Greeting flow", state: "Ready" },
        { label: "Fallback handling", state: "Ready" },
        { label: "API connection", state: "Live" },
        { label: "Human handoff", state: "Ready" },
    ];

    const stats = [
        { value: "182 ms", label: "Avg response" },
        { value: "98.7%", label: "Intent match" },
        { value: "24/7", label: "Availability" },
    ];

    return (
        <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(232,121,249,0.10),transparent_22%)]" />

            <div className={`relative mx-auto w-full ${compact ? "max-w-6xl" : "max-w-7xl"}`}>
                <div className={`rounded-4xl border ${currentTheme.borderGlow} ${currentTheme.card} ${currentTheme.shell} overflow-hidden backdrop-blur-2xl`}>
                    <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${currentTheme.sub}`}>Live assistant preview</p>
                            <h2 className={`mt-2 text-xl font-black sm:text-2xl ${currentTheme.text}`}>End-to-end voice experience</h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPreviewTheme(previewTheme === "dark" ? "light" : "dark")}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${currentTheme.btnSecondary}`}
                            >
                                {previewTheme === "dark" ? "Switch to light" : "Switch to dark"}
                            </button>
                            <button
                                type="button"
                                onClick={toggleListening}
                                disabled={!speechSupported || isRequesting}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${currentTheme.btnPrimary}`}
                            >
                                {listening ? <FiPause /> : <FiMic />}
                                {speechSupported ? (listening ? "Stop listening" : isRequesting ? "Waiting reply" : "Start listening") : "Speech not supported"}
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-0 xl:grid-cols-[1.02fr_0.98fr]">
                        <div className="relative border-b border-white/10 xl:border-b-0 xl:border-r xl:border-white/10">
                            <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[44px_44px]" />

                            <div className="relative mx-auto flex max-w-107.5 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
                                <div className={`rounded-4xl border ${currentTheme.borderGlow} ${currentTheme.overlay} px-4 py-4 shadow-[0_30px_90px_rgba(2,6,23,0.35)]`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                                                <div className={`absolute inset-0 rounded-2xl ${currentTheme.orbOne} blur-xl`} />
                                                <FiMic className="relative text-lg text-white" />
                                            </div>
                                            <div>
                                                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${currentTheme.sub}`}>Assistant</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <h3 className={`text-base font-bold ${currentTheme.text}`}>{assistantName}</h3>
                                                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${currentTheme.listening}`}>
                                                        {listening ? "Listening" : "Paused"}
                                                    </span>
                                                </div>
                                                <p className={`mt-1 text-xs ${currentTheme.sub}`}>{businessType}</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className={`rounded-full border p-2 ${currentTheme.btnSecondary}`}
                                            aria-label="More options"
                                        >
                                            <FiMoreHorizontal />
                                        </button>
                                    </div>

                                    <div className="mt-5 rounded-[1.7rem] border border-white/10 bg-black/10 p-4">
                                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                                            <span>Voice input</span>
                                            <span className="flex items-center gap-2 text-emerald-300">
                                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                                Stable connection
                                            </span>
                                        </div>

                                        <div className="mt-4 flex items-end gap-2">
                                            {[14, 24, 40, 28, 44, 30, 48, 22, 38, 18].map((height, index) => (
                                                <div
                                                    key={height + index}
                                                    className={`flex-1 rounded-full ${currentTheme.wave} ${userSpeaking ? "animate-pulse" : listening ? "opacity-75" : "opacity-40"}`}
                                                    style={{ height: `${height}px`, animationDelay: `${index * 80}ms` }}
                                                />
                                            ))}
                                        </div>

                                        {listening ? (
                                            <div className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-3 text-sm text-cyan-100">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/90">Listening...</p>
                                                <p className="mt-1 min-h-5">{liveTranscript || "Speak now..."}</p>
                                            </div>
                                        ) : null}

                                        <p className={`mt-3 text-xs ${currentTheme.sub}`}>{voiceStatus}</p>
                                    </div>

                                    <div
                                        ref={messagesContainerRef}
                                        className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1"
                                    >
                                        {messages.map((message, index) => (
                                            <div
                                                key={message.title + index}
                                                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`max-w-[84%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                                                        message.role === "user"
                                                            ? "bg-cyan-400 text-slate-950"
                                                            : `${currentTheme.overlay} border ${currentTheme.borderGlow} ${currentTheme.text}`
                                                    }`}
                                                >
                                                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] opacity-70">{message.title}</p>
                                                    <p>{message.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 flex items-center justify-end">
                                        <button
                                            type="button"
                                            onClick={retryLastQuestion}
                                            disabled={!lastQuestion || isRequesting}
                                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${currentTheme.btnSecondary}`}
                                        >
                                            {isRequesting ? "Waiting..." : "Retry last question"}
                                        </button>
                                    </div>

                                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {quickActions.map((action) => (
                                            <button
                                                key={action}
                                                type="button"
                                                className={`rounded-2xl border px-3 py-3 text-xs font-semibold transition ${currentTheme.btnSecondary}`}
                                            >
                                                {action}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-5 flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 px-3 py-3">
                                        <button
                                            type="button"
                                            onClick={toggleListening}
                                            disabled={!speechSupported || isRequesting}
                                            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${currentTheme.btnPrimary}`}
                                        >
                                            <FiMic />
                                        </button>
                                        <div className="min-w-0 flex-1">
                                            <p className={`truncate text-sm font-semibold ${currentTheme.text}`}>Say something to test the assistant</p>
                                            <p className={`truncate text-xs ${currentTheme.sub}`}>{isRequesting ? "Waiting for backend response..." : "Try a booking request, support question, or handoff flow."}</p>
                                        </div>
                                        <button
                                            type="button"
                                            className={`rounded-2xl border p-3 ${currentTheme.btnSecondary}`}
                                            aria-label="Voice settings"
                                        >
                                            <FiSettings />
                                        </button>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2 rounded-[1.2rem] border border-white/10 bg-black/10 px-3 py-3">
                                        <input
                                            value={questionInput}
                                            onChange={(event) => setQuestionInput(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.preventDefault();
                                                    submitQuestion(questionInput, "text");
                                                }
                                            }}
                                            placeholder="Type your question and press Enter"
                                            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => submitQuestion(questionInput, "text")}
                                            disabled={isRequesting || !questionInput.trim()}
                                            className={`rounded-xl px-3 py-2 text-xs font-semibold ${currentTheme.btnPrimary}`}
                                        >
                                            {isRequesting ? "Sending..." : "Send"}
                                        </button>
                                    </div>

                                    <div className={`mt-5 rounded-[1.7rem] border px-4 py-4 ${currentTheme.overlay} ${currentTheme.borderGlow}`}>
                                        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${currentTheme.sub}`}>Assistant summary</p>
                                        <h4 className={`mt-2 text-base font-bold ${currentTheme.text}`}>{businessName}</h4>
                                        <p className={`mt-2 text-sm leading-6 ${currentTheme.sub}`}>{businessDescription}</p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${currentTheme.badge}`}>{tone}</span>
                                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${currentTheme.badge}`}>{previewTheme}</span>
                                        </div>
                                    </div>

                                    {pages.length > 0 ? (
                                        <div className={`mt-5 rounded-[1.7rem] border px-4 py-4 ${currentTheme.overlay} ${currentTheme.borderGlow}`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${currentTheme.sub}`}>Navigation map</p>
                                                    <h4 className={`mt-2 text-base font-bold ${currentTheme.text}`}>Pages reflected in the UI</h4>
                                                </div>
                                                <FiArrowUpRight className={currentTheme.sub} />
                                            </div>

                                            <div className="mt-4 space-y-3">
                                                {pages.slice(0, 4).map((page) => (
                                                    <div key={`${page.path}-${page.name}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div>
                                                                <p className={`text-sm font-semibold ${currentTheme.text}`}>{page.name}</p>
                                                                <p className={`mt-1 text-xs ${currentTheme.sub}`}>{page.url}</p>
                                                            </div>
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${currentTheme.badge}`}>
                                                                /{page.path}
                                                            </span>
                                                        </div>
                                                        {page.keywords?.length ? (
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {page.keywords.slice(0, 4).map((keyword) => (
                                                                    <span key={keyword} className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-[11px] text-slate-300">
                                                                        {keyword}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="relative px-5 py-6 sm:px-6 sm:py-8">
                            <div className="space-y-5">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {stats.map((stat) => (
                                        <div
                                            key={stat.label}
                                            className={`rounded-3xl border px-4 py-4 ${currentTheme.overlay} ${currentTheme.borderGlow}`}
                                        >
                                            <div className={`text-2xl font-black ${currentTheme.text}`}>{stat.value}</div>
                                            <div className={`mt-1 text-sm ${currentTheme.sub}`}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className={`rounded-[1.7rem] border px-5 py-5 ${currentTheme.overlay} ${currentTheme.borderGlow}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${currentTheme.sub}`}>Deployment checklist</p>
                                            <h3 className={`mt-2 text-lg font-bold ${currentTheme.text}`}>Ready for production preview</h3>
                                        </div>
                                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                                            <FiCheckCircle />
                                            All systems go
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {checklist.map((item) => (
                                            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                                <div className={`text-sm font-medium ${currentTheme.text}`}>{item.label}</div>
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${currentTheme.badge}`}>
                                                    {item.state}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className={`rounded-[1.7rem] border px-5 py-5 ${currentTheme.overlay} ${currentTheme.borderGlow}`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`rounded-2xl p-3 ${currentTheme.btnSecondary}`}>
                                                <FiClock />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold ${currentTheme.text}`}>Runtime monitor</p>
                                                <p className={`mt-1 text-sm leading-6 ${currentTheme.sub}`}>
                                                    Response latency, routing, and handoff logic are visible before you publish the assistant.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`rounded-[1.7rem] border px-5 py-5 ${currentTheme.overlay} ${currentTheme.borderGlow}`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`rounded-2xl p-3 ${currentTheme.btnSecondary}`}>
                                                <FiPhoneCall />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold ${currentTheme.text}`}>Test handoff</p>
                                                <p className={`mt-1 text-sm leading-6 ${currentTheme.sub}`}>
                                                    Seamlessly send the conversation to a live agent with context preserved.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`rounded-[1.7rem] border px-5 py-5 ${currentTheme.overlay} ${currentTheme.borderGlow}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${currentTheme.sub}`}>Next action</p>
                                            <h3 className={`mt-2 text-lg font-bold ${currentTheme.text}`}>One-click preview lifecycle</h3>
                                        </div>
                                        <FiArrowUpRight className={`text-xl ${currentTheme.sub}`} />
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        {[
                                            "Build prompt",
                                            "Run test conversation",
                                            "Ship to production",
                                        ].map((step, index) => (
                                            <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">0{index + 1}</div>
                                                <div className={`mt-2 text-sm font-semibold ${currentTheme.text}`}>{step}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AssistantPreview;