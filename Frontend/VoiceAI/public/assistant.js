(() => {
  const currentScript =
    document.currentScript ||
    Array.from(document.getElementsByTagName("script")).pop();

  if (!currentScript) {
    return;
  }

  const dataset = currentScript.dataset || {};
  const userId = dataset.userId || dataset.assistantId;
  const apiBase = (dataset.apiBase || "http://localhost:5000").replace(/\/$/, "");
  const theme =
    (dataset.theme || "light").toLowerCase() === "light" ? "light" : "dark";
  const position = dataset.position || "bottom-right";
  const assistantName = dataset.assistantName || "Voice Assistant";
  const enableVoice = String(dataset.enableVoice || "true").toLowerCase() !== "false";
  const recognitionClass =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

  const pickSpeechLanguage = () => {
    const explicit = String(dataset.lang || "").trim();
    if (explicit) {
      return explicit;
    }

    const languages = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language || "en-US"];
    const preferred = String(languages[0] || "en-US").toLowerCase();
    if (preferred.startsWith("hi")) {
      return "hi-IN";
    }
    if (preferred.startsWith("gu")) {
      return "gu-IN";
    }
    return preferred || "en-US";
  };

  if (!userId) {
    console.error("[Shifra Voice AI] Missing data-user-id on assistant.js embed.");
    return;
  }

  if (document.getElementById("shifra-voice-ai-styles") === null) {
    const link = document.createElement("link");
    link.id = "shifra-voice-ai-styles";
    link.rel = "stylesheet";
    link.href = new URL("assistant.css", currentScript.src).toString();
    document.head.appendChild(link);
  }

  if (document.getElementById("shifra-voice-ai-root")) {
    return;
  }

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const root = document.createElement("div");
  root.id = "shifra-voice-ai-root";
  root.className = `shifra-voice-ai-root shifra-position-${position} shifra-theme-${theme}`;
  root.dataset.theme = theme;
  root.dataset.position = position;
  root.dataset.listening = "false";
  root.dataset.userSpeaking = "false";
  root.dataset.speaking = "false";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "shifra-voice-ai-trigger";
  trigger.innerHTML =
    '<img class="shifra-voice-ai-brand" alt="Shifra"><span class="shifra-voice-ai-trigger-dot"></span><span>Voice Assistant</span>';

  const panel = document.createElement("div");
  panel.className = "shifra-voice-ai-panel";
  panel.style.display = "none";
  panel.innerHTML =
    '<div class="shifra-voice-ai-panel-inner">' +
    '<div class="shifra-voice-ai-panel-header">' +
    "<div>" +
    '<div class="shifra-voice-ai-brand-row"><img class="shifra-voice-ai-brand" alt="Shifra"></div>' +
    '<div class="shifra-voice-ai-kicker">Shifra Voice AI</div>' +
    '<h3 class="shifra-voice-ai-title">Voice assistant preview</h3>' +
    "</div>" +
    '<button class="shifra-voice-ai-close" type="button" aria-label="Close assistant">&times;</button>' +
    "</div>" +
    '<div class="shifra-voice-ai-hero">' +
    '<div class="shifra-voice-ai-orb-wrap">' +
    '<div class="shifra-voice-ai-orb-glow"></div>' +
    '<div class="shifra-voice-ai-orb"></div>' +
    "</div>" +
    '<div class="shifra-voice-ai-status-row">' +
    '<span class="shifra-voice-ai-status-dot"></span>' +
    '<span class="shifra-voice-ai-status-text" id="shifra-voice-ai-status">Ready to listen</span>' +
    "</div>" +
    '<div class="shifra-voice-ai-hero-copy">Speak naturally, get a text answer, and hear it back as voice.</div>' +
    "</div>" +
    '<div class="shifra-voice-ai-wave">' +
    "<span></span><span></span><span></span><span></span><span></span><span></span>" +
    "</div>" +
    '<div class="shifra-voice-ai-card">' +
    '<div id="shifra-widget-body" class="shifra-voice-ai-body">Loading assistant...</div>' +
    "</div>" +
    '<div class="shifra-voice-ai-footer">' +
    '<button id="shifra-voice-ai-mic" class="shifra-voice-ai-mic" type="button" aria-label="Voice input">' +
    '<img class="shifra-voice-ai-mic-icon" alt="Mic">' +
    "</button>" +
    '<div class="shifra-voice-ai-footer-copy">Tap the mic and speak your question.</div>' +
    "</div>" +
    "</div>";

  root.appendChild(trigger);
  root.appendChild(panel);
  document.body.appendChild(root);

  const brandSrc = new URL("logo.png", currentScript.src).toString();
  const micSrc = new URL("mic.png", currentScript.src).toString();

  root.querySelectorAll(".shifra-voice-ai-brand").forEach((image) => {
    image.src = brandSrc;
  });

  const micIcon = root.querySelector("#shifra-voice-ai-mic .shifra-voice-ai-mic-icon");
  if (micIcon) {
    micIcon.src = micSrc;
  }

  const state = {
    config: null,
    messages: [],
    isListening: false,
    isUserSpeaking: false,
    isSpeaking: false,
    isStartingRecognition: false,
    status: "Ready to listen",
    liveTranscript: "",
    lastVoiceMessage: "",
  };

  const body = panel.querySelector("#shifra-widget-body");
  const statusNode = panel.querySelector("#shifra-voice-ai-status");
  const micButton = panel.querySelector("#shifra-voice-ai-mic");
  const closeButton = panel.querySelector(".shifra-voice-ai-close");

  const applyTheme = (value) => {
    const nextTheme =
      String(value || theme || "dark").toLowerCase() === "light" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    root.classList.remove("shifra-theme-light", "shifra-theme-dark");
    root.classList.add(`shifra-theme-${nextTheme}`);
  };

  const renderBody = () => {
    if (!body) {
      return;
    }

    const title = escapeHtml(state.config?.assistantname || assistantName);
    const intro = escapeHtml(
      state.config?.businessdescription ||
        "Your assistant is ready to use on this site.",
    );
    const statusText = escapeHtml(state.status);

    const showListeningBubble = state.isListening || Boolean(state.liveTranscript);
    const listeningText = state.liveTranscript
      ? escapeHtml(state.liveTranscript)
      : "Listening...";
    const liveTranscriptHtml = showListeningBubble
      ? '<div class="shifra-voice-ai-listening-bubble">' +
          '<div class="shifra-voice-ai-listening-label">Listening...</div>' +
          `<div class="shifra-voice-ai-listening-text">${listeningText}</div>` +
        '</div>'
      : "";

    const messageHtml = state.messages.length
      ? state.messages
          .map((message) => {
            const isUser = message.role === "user";
            const background = isUser
              ? "linear-gradient(135deg, rgba(34, 211, 238, 0.20), rgba(59, 130, 246, 0.16)), rgba(15, 23, 42, 0.38)"
              : root.dataset.theme === "light"
                ? "rgba(255, 255, 255, 0.94)"
                : "rgba(255, 255, 255, 0.06)";
            const border = isUser ? "rgba(34, 211, 238, 0.22)" : "rgba(148, 163, 184, 0.16)";
            const color = isUser ? "#e0f2fe" : "inherit";
            return `<div style="margin-top:10px;padding:12px 14px;border-radius:16px;background:${background};border:1px solid ${border};line-height:1.6;color:${color};white-space:pre-wrap;">${escapeHtml(
              message.text,
            )}</div>`;
          })
          .join("")
      : `<div style="margin-top:12px;font-size:14px;line-height:1.6;color:${root.dataset.theme === "light" ? "rgba(15,23,42,0.74)" : "rgba(226,232,240,0.84)"};">Try asking about pricing, services, support, or anything on this website.</div>`;

    body.innerHTML =
      `<div class="shifra-voice-ai-body-title">${title}</div>` +
      `<div class="shifra-voice-ai-body-copy">${intro}</div>` +
      `<div class="shifra-voice-ai-body-meta">${statusText}</div>` +
      liveTranscriptHtml +
      `<div style="margin-top:10px;display:grid;gap:10px;">${messageHtml}</div>`;
  };

  const setStatus = (value) => {
    state.status = value;
    if (statusNode) {
      statusNode.textContent = value;
    }
    renderBody();
  };

  const setListening = (value) => {
    state.isListening = value;
    state.isStartingRecognition = false;
    root.dataset.listening = value ? "true" : "false";
    if (!value) {
      state.liveTranscript = "";
      setUserSpeaking(false);
    }
    if (micButton) {
      micButton.dataset.active = value ? "true" : "false";
    }
    renderBody();
  };

  const setUserSpeaking = (value) => {
    state.isUserSpeaking = value;
    root.dataset.userSpeaking = value ? "true" : "false";
  };

  const setSpeaking = (value) => {
    state.isSpeaking = value;
    root.dataset.speaking = value ? "true" : "false";
  };

  const navigateToTarget = (navigation) => {
    if (!navigation?.target) {
      return false;
    }

    const targetUrl = new URL(navigation.target, window.location.origin).toString();
    setStatus(`Navigating to ${navigation.pageName || navigation.target}...`);
    setTimeout(() => {
      window.location.assign(targetUrl);
    }, 300);
    return true;
  };

  const appendMessage = (role, text) => {
    state.messages.push({ role, text });
    renderBody();
  };

  const speakText = (text) => {
    if (!enableVoice || !window.speechSynthesis || !text) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = pickSpeechLanguage();
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => {
      setSpeaking(true);
    };
    utterance.onend = () => {
      setSpeaking(false);
    };
    utterance.onerror = () => {
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakReplyAndNavigate = (reply, navigation) => {
    if (!navigation?.target) {
      speakText(reply);
      return;
    }

    const targetUrl = new URL(navigation.target, window.location.origin).toString();
    const performNavigation = () => {
      setStatus(`Navigating to ${navigation.pageName || navigation.target}...`);
      window.location.assign(targetUrl);
    };

    if (!enableVoice || !window.speechSynthesis || !reply) {
      window.setTimeout(performNavigation, 300);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.lang = pickSpeechLanguage();
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => {
      setSpeaking(true);
    };
    utterance.onend = () => {
      setSpeaking(false);
      performNavigation();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      performNavigation();
    };

    window.speechSynthesis.speak(utterance);
  };

  const loadConfig = async () => {
    try {
      setStatus("Loading assistant config...");
      const response = await fetch(
        `${apiBase}/api/assistant/config/${encodeURIComponent(userId)}`,
      );
      if (!response.ok) {
        throw new Error(`Config request failed with status ${response.status}`);
      }

      const data = await response.json();
      state.config = data;
      applyTheme(data.theme || theme);
      setStatus(data.enablevoice === false ? "Text chat ready" : "Ready to listen");
      renderBody();
      if (!state.messages.length) {
        appendMessage(
          "assistant",
          `Hello, I am ${data.assistantname || assistantName}. Ask me anything about this website.`,
        );
      }
    } catch (error) {
      console.error("[Shifra Voice AI]", error);
      setStatus("Unable to load assistant config.");
      renderBody();
    }
  };

  const sendQuestion = async (text, source = "text") => {
    const message = String(text || "").trim();
    if (!message) {
      return;
    }

    state.liveTranscript = "";
    appendMessage("user", message);
    setStatus(source === "voice" ? "Thinking from voice..." : "Thinking...");

    try {
      const response = await fetch(
        `${apiBase}/api/assistant/chat/${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            history: state.messages,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || `Request failed with status ${response.status}`);
      }

      const reply = data?.reply || "I could not generate a reply right now.";
      appendMessage("assistant", reply);
      setStatus(data?.enablevoice === false ? "Text reply ready" : "Reply ready");

      if (data?.navigation?.target) {
        speakReplyAndNavigate(reply, data.navigation);
        return;
      }

      if (data?.enablevoice !== false && enableVoice) {
        speakText(reply);
      }
    } catch (error) {
      console.error("[Shifra Voice AI]", error);
      const fallbackReply =
        "I could not reach the assistant backend, but the widget is working on the front end.";
      appendMessage("assistant", fallbackReply);
      setStatus("Assistant backend unavailable.");
    }
  };

  let recognition = null;
  if (recognitionClass) {
    recognition = new recognitionClass();
    recognition.lang = pickSpeechLanguage();
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setStatus("Listening...");
    };

    recognition.onspeechstart = () => {
      setUserSpeaking(true);
      setStatus("You are speaking...");
    };

    recognition.onspeechend = () => {
      setUserSpeaking(false);
      if (state.isListening) {
        setStatus("Listening...");
      }
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

      state.liveTranscript = (interim || finalText).trim();
      renderBody();

      const finalTranscript = finalText.trim();
      if (finalTranscript) {
        if (finalTranscript === state.lastVoiceMessage) {
          return;
        }
        state.lastVoiceMessage = finalTranscript;
        setUserSpeaking(false);
        setStatus("Sending your voice message...");
        sendQuestion(finalTranscript, "voice");
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      setUserSpeaking(false);
      console.error("[Shifra Voice AI] SpeechRecognition error", event.error || event);
      if (event.error === "not-allowed") {
        setStatus("Microphone permission denied. Allow microphone and try again.");
      } else if (event.error === "no-speech") {
        setStatus("No speech detected. Please speak and try again.");
      } else if (event.error === "audio-capture") {
        setStatus("No microphone device found.");
      } else if (event.error === "aborted") {
        setStatus("Listening stopped.");
      } else {
        setStatus("Voice input unavailable.");
      }
    };

    recognition.onend = () => {
      setListening(false);
      setUserSpeaking(false);
      if (
        state.status === "Listening..." ||
        state.status === "You are speaking..."
      ) {
        setStatus("Ready to listen");
      }
    };
  }

  const setOpen = (nextValue) => {
    root.classList.toggle("is-open", nextValue);
    panel.style.display = nextValue ? "block" : "none";
    if (nextValue && !state.config) {
      loadConfig();
    }
  };

  const startVoiceCapture = () => {
    if (!recognition) {
      setStatus("Speech recognition is not supported in this browser.");
      return;
    }

    if (state.isStartingRecognition) {
      return;
    }

    setOpen(true);

    if (state.isListening) {
      try {
        recognition.stop();
      } catch (error) {
        console.error("[Shifra Voice AI]", error);
      }
      return;
    }

    try {
      state.isStartingRecognition = true;
      state.liveTranscript = "";
      setStatus("Listening for your question...");
      recognition.start();
    } catch (error) {
      state.isStartingRecognition = false;
      console.error("[Shifra Voice AI]", error);
      setStatus("Unable to start microphone. Wait a moment and try again.");
    }
  };

  trigger.addEventListener("click", () => {
    const nextOpen = panel.style.display === "none";
    setOpen(nextOpen);
    if (nextOpen) {
      startVoiceCapture();
    }
  });

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      setOpen(false);
      if (state.isListening && recognition) {
        recognition.stop();
      }
    });
  }

  if (micButton) {
    if (!recognition) {
      micButton.setAttribute("disabled", "disabled");
      setStatus("Speech recognition is not supported in this browser.");
    } else {
      micButton.addEventListener("click", startVoiceCapture);
    }
  }

  renderBody();
})();