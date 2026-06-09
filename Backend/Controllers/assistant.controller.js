import User from "../Models/user.model.js";

const GEMINI_MODEL = "gemini-1.5-flash";

const NAVIGATION_ACTIONS = ["open", "go", "start", "navigate", "take me", "visit", "show me", "bring me"];
const HINDI_NAVIGATION_ACTIONS = ["खोलो", "जाओ", "ले चलो", "दिखाओ", "ओपन", "नेविगेट", "मुझे ले चलो", "home पेज", "होम पेज"];
const GUJARATI_NAVIGATION_ACTIONS = ["ખોલો", "જાઓ", "લઈ જાઓ", "બતાવો", "ઓપન", "નેવિગેટ", "મને લઈ જાઓ", "હોમ પેજ"];

const LANGUAGE_LABELS = {
    en: "English",
    hi: "Hindi",
    gu: "Gujarati",
};

const NAVIGATION_REPLY_TEMPLATES = {
    en: (pageName) => `Taking you to ${pageName}.`,
    hi: (pageName) => `${pageName} पेज पर ले जा रहा हूँ।`,
    gu: (pageName) => `તમને ${pageName} પેજ પર લઈ જઈ રહ્યો છું.`,
};

const LOCALIZED_PAGE_NAMES = {
    en: {
        home: "Home",
        builder: "Builder",
        billing: "Billing",
    },
    hi: {
        home: "होम",
        builder: "बिल्डर",
        billing: "बिलिंग",
    },
    gu: {
        home: "હોમ",
        builder: "બિલ્ડર",
        billing: "બિલિંગ",
    },
};

const normalizeText = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9\s/.-]/g, " ").replace(/\s+/g, " ").trim();

const detectLanguage = (value) => {
    const text = String(value || "");
    if(/[\u0A80-\u0AFF]/.test(text)) {
        return "gu";
    }

    if(/[\u0900-\u097F]/.test(text)) {
        return "hi";
    }

    return "en";
};

const hasAnyAction = (message, actions) => actions.some((word) => message.startsWith(word) || message.includes(` ${word} `));

const buildNavigationTarget = (page) => {
    const rawPath = String(page?.path || "").trim();
    if (!rawPath) {
        return null;
    }

    if (rawPath === "home" || rawPath === "/" || rawPath === "index") {
        return "/";
    }

    return rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
};

const detectNavigationIntent = (user, message) => {
    if (!user?.enablenavigation) {
        return null;
    }

    const cleanMessage = normalizeText(message);
    const rawMessage = String(message || "").toLowerCase();
    if (!cleanMessage) {
        return null;
    }

    const pages = Array.isArray(user.page) ? user.page : [];
    const actionMatch =
        hasAnyAction(cleanMessage, NAVIGATION_ACTIONS) ||
        hasAnyAction(rawMessage, HINDI_NAVIGATION_ACTIONS) ||
        hasAnyAction(rawMessage, GUJARATI_NAVIGATION_ACTIONS);
    if (!actionMatch && !cleanMessage.includes("page")) {
        return null;
    }

    for (const page of pages) {
        const pageName = normalizeText(page?.name);
        const pagePath = normalizeText(page?.path);
        const keywords = Array.isArray(page?.keywords) ? page.keywords.map(normalizeText).filter(Boolean) : [];
        const target = buildNavigationTarget(page);

        if (!target) {
            continue;
        }

        const matchesPageName = pageName && cleanMessage.includes(pageName);
        const matchesPagePath = pagePath && cleanMessage.includes(pagePath);
        const matchesKeyword = keywords.some((keyword) => keyword && cleanMessage.includes(keyword));

        if (matchesPageName || matchesPagePath || matchesKeyword) {
            return {
                pageName: page?.name || pagePath || target,
                target,
            };
        }
    }

    return null;
};

const getLocalizedPageName = (language, pageName) => {
    const normalized = normalizeText(pageName);
    const dictionary = LOCALIZED_PAGE_NAMES[language] || LOCALIZED_PAGE_NAMES.en;

    if (normalized.includes("home")) {
        return dictionary.home;
    }

    if (normalized.includes("builder")) {
        return dictionary.builder;
    }

    if (normalized.includes("billing")) {
        return dictionary.billing;
    }

    return pageName;
};

const buildAssistantContext = (user) => {
    const pages = Array.isArray(user.page) ? user.page : [];
    const pageSummary = pages.length
        ? pages
            .map((page) => {
                const keywords = Array.isArray(page.keywords) && page.keywords.length ? ` Keywords: ${page.keywords.join(", ")}.` : "";
                return `${page.name || "Page"} (${page.path || ""}).${keywords}`;
            })
            .join(" ")
        : "No page map was configured yet.";

    return [
        `Assistant name: ${user.assistantname || "Voice Assistant"}`,
        `Business name: ${user.businessname || "Unknown business"}`,
        `Business type: ${user.businesstype || "General"}`,
        `Tone: ${user.tone || "Friendly"}`,
        `Description: ${user.businessdescription || ""}`,
        `Pages: ${pageSummary}`,
    ].join("\n");
};

const buildFallbackReply = (user, question) => {
    const assistantName = user.assistantname || "Voice Assistant";
    const businessName = user.businessname || "this business";
    const description = user.businessdescription || "the configured services on this site";
    return `I am ${assistantName} for ${businessName}. Based on ${description}, I heard: ${question}. If you want, I can guide you to the right page or explain the available service.`;
};

const callGemini = async (apiKey, prompt) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 256,
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    return reply || "";
};

export const getAssistantConfig = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select(
            "assistantname businessname businesstype businessdescription tone theme page enablevoice enablenavigation",
        );

        if (!user) {
            return res.status(404).json({ message: "Widget assistant not found" });
        }

        return res.status(200).json({
            userId: user._id,
            assistantname: user.assistantname,
            businessname: user.businessname,
            businesstype: user.businesstype,
            businessdescription: user.businessdescription,
            tone: user.tone,
            theme: user.theme,
            pages: user.page,
            enablevoice: user.enablevoice,
            enablenavigation: user.enablenavigation,
        });
    } catch (error) {
        return res.status(500).json({ message: `Failed to load widget config ${error.message}` });
    }
};

export const chatAssistant = async (req, res) => {
    try {
        const { userId } = req.params;
        const message = String(req.body?.message || req.body?.question || "").trim();
        const language = detectLanguage(message);

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Widget assistant not found" });
        }

        if (user.requestlimit && Number(user.totalmessages || 0) >= Number(user.requestlimit)) {
            return res.status(429).json({ message: "Assistant usage limit reached" });
        }

        const navigation = detectNavigationIntent(user, message);
        const localizedNavigationName = navigation ? getLocalizedPageName(language, navigation.pageName) : null;

        const prompt = [
            "You are a website voice assistant. Keep answers concise, helpful, and natural for spoken delivery.",
            `The user language is ${LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en}. Reply in the same language as the user when possible.`,
            navigation
                ? `The user is asking to navigate to: ${navigation.pageName}. If you answer, keep it short and action-oriented.`
                : "If the user is asking to navigate to a page, respond naturally but do not invent routes.",
            `Use this assistant context:\n${buildAssistantContext(user)}`,
            `User asked: ${message}`,
            "Reply in a short paragraph or a few short sentences.",
        ].join("\n\n");

        let reply = "";

        if (user.geminiapikey) {
            try {
                reply = await callGemini(user.geminiapikey, prompt);
            } catch (error) {
                console.error("[Shifra Voice AI] Gemini fallback:", error.message);
            }
        }

        if (!reply) {
            reply = buildFallbackReply(user, message);
        }

        if (navigation) {
            reply = NAVIGATION_REPLY_TEMPLATES[language]
                ? NAVIGATION_REPLY_TEMPLATES[language](localizedNavigationName || navigation.pageName)
                : NAVIGATION_REPLY_TEMPLATES.en(localizedNavigationName || navigation.pageName);
        }

        user.totalmessages = Number(user.totalmessages || 0) + 1;
        await user.save();

        return res.status(200).json({
            reply,
            assistantname: user.assistantname,
            enablevoice: user.enablevoice,
            enablenavigation: user.enablenavigation,
            navigation,
            language,
        });
    } catch (error) {
        return res.status(500).json({ message: `Assistant chat failed ${error.message}` });
    }
};


export const askassistant = async(req,res) => {
        try{
            const{message,userid} = req.body
            if(!message || !userid){
                return res.status(400).json({error:"Message and user ID are required"})
            }
            const user = await User.findById(userid)
            if(!user){
                return res.status(404).json({error:"User not found"})
            }
            if(!user.geminiapikey){
                return res.status(403).json({error:"Gemini API key not set for this user"})
            }
            if(user.geministatus === "inactive"){
                return res.status(403).json({error:"Gemini API is inactive for this user. Please check your API key."})
            }
            if(user.geministatus === "quota_exceeded"){
                return res.status(403).json({error:"Gemini API quota exceeded for this user. Please wait and try again later."})
            }
            if(user.plan === "free" && user.totalmessages >= user.requestlimit){
                
                return res.status(403).json({error:"Request limit reached for free plan. Please upgrade to Pro for more requests."})
            }
            if(user.plan === "pro" && user.proexpireat && user.proexpireat < new Date()){
                user.plan = "free"
                user.totalmessages = 200
                await user.save()
                return res.status(403).json({error:"Pro plan has expired. Please renew your subscription to continue using Gemini API."})
            }
            const cleanmessage = message.toLowerCase().trim()
            
            if(user.enablenavigation){
                const navigationword=[
                    'open',
                    'go',
                    'start',
                    'navigate',
                    'take me'
                ];

                // Check navigation intent
                const wantnavigation =
                 navigationword.some(word => cleanmessage.startsWith(word));

                 if(wantnavigation){
                    const matchedpage = await Page.find((page)=> page.keywords.some(keyword => cleanmessage.includes(keyword.toLowerCase())));

                    if(matchedpage){
                          if(req.body.url === matchedpage.url){
                            return res.json({response:`You are already on the ${matchedpage.name} page.`})
                          }           
                    }
                    return res.json({response: wantnavigation ? `It seems like you want to navigate to the ${matchedpage ? matchedpage.name : "unknown"} page. Please confirm if you want to go there.` : "How can I assist you?"})
                 }
            }
            const response = await generategeminiresponse({prompt:cleanmessage,apikey:user.geminiapikey,user})
            if(!response){
                return res.status(500).json({error:"Failed to get response from Gemini API"})
            }

            if(user.plan === "free"){
                    user.totalmessages +=1
                    await user.save()
            }

            return res.json({success:true,response:response})
        }
        catch(error){
            console.error("Error asking assistant:", error)
            return res.status(500).json({error:"Failed to get response from Gemini API"})
        }
} 