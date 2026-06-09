import crypto from "crypto";
import Razorpay from "razorpay";
import User from "../Models/user.model.js"

const PRO_PLAN_AMOUNT = Number(process.env.PRO_PLAN_AMOUNT || 49900); // paise
const PRO_PLAN_CURRENCY = process.env.PRO_PLAN_CURRENCY || "INR";
const PRO_PLAN_DAYS = Number(process.env.PRO_PLAN_DAYS || 30);
const PRO_PLAN_LIMIT = Number(process.env.PRO_PLAN_LIMIT || 1000);

const razorpayClient = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    : null;

const addDays = (days) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + Number(days || 0));
    return nextDate;
};


export const getcurruser = async(req,res)=>{
        try{
            if (!req.userId) {
                return res.status(401).json({ message: "Unauthorized user" })
            }

            const user = await User.findById(req.userId)
            if(!user){
                return res.status(404).json({ message: "User not found" })
            }
            res.status(200).json({"user":user})

        } catch (error) {
            res.status(500).json({"message":` getCurrentuser error${error.message}`})
        }
}

export const createBillingOrder = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized user" });
        }

        if (!razorpayClient) {
            return res.status(500).json({ message: "Razorpay is not configured" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const order = await razorpayClient.orders.create({
            amount: PRO_PLAN_AMOUNT,
            currency: PRO_PLAN_CURRENCY,
            receipt: `pro_${user._id}_${Date.now()}`,
            notes: {
                userId: String(user._id),
                plan: "pro",
            },
        });

        return res.status(200).json({
            keyId: process.env.RAZORPAY_KEY_ID,
            order,
            amount: PRO_PLAN_AMOUNT,
            currency: PRO_PLAN_CURRENCY,
            plan: "pro",
        });
    } catch (error) {
        console.error("[Shifra Voice AI] createBillingOrder error", error);
        return res.status(500).json({ message: `Failed to create payment order ${error.message}` });
    }
};

export const verifyBillingPayment = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized user" });
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ message: "Razorpay is not configured" });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body || {};

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing payment verification fields" });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.plan = "pro";
        user.requestlimit = PRO_PLAN_LIMIT;
        user.proexpireat = addDays(PRO_PLAN_DAYS);
        user.geministatus = "active";
        await user.save();

        return res.status(200).json({
            message: "Payment verified and plan upgraded to Pro",
            user,
        });
    } catch (error) {
        console.error("[Shifra Voice AI] verifyBillingPayment error", error);
        return res.status(500).json({ message: `Failed to verify payment ${error.message}` });
    }
};

export const saveassistant = async(req,res) => {
    try{
        const{
            assistantname,
            businessname,
            businesstype,
            businessdescription,
            tone,
            theme,
            plan,
            planQuota,
            planExpiry,
            geminiapikey,
            page
        } = req.body
        const user = await User.findById(req.userId)
        if(!user){
                return res.status(404).json({ message: "User not found" })
        }
        user.assistantname = assistantname;
        user.businessname = businessname;
        user.businesstype = businesstype;
        user.businessdescription = businessdescription;
        user.tone = tone;
        user.theme = theme;
        user.plan = plan || user.plan;
        const parsedPlanQuota = Number(planQuota);
        if (Number.isFinite(parsedPlanQuota)) {
            user.requestlimit = parsedPlanQuota;
        }
        user.proexpireat = planExpiry ? new Date(planExpiry) : null;

        if(geminiapikey){
            user.geminiapikey = geminiapikey
        }
        user.geministatus = "active";
        user.page = page || [];
        user.issetupcomplete = true
        await user.save()
        return res.status(200).json({"message" : "Assistant saved successfully"})
    }
    catch(error){
        return res.status(400).json({message : `failed to save  assistant ${error}`})

    }
}

export const getWidgetConfig = async (req, res) => {
        try {
                const { userId } = req.params

        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type")

                const user = await User.findById(userId).select(
                        "assistantname businessname businesstype businessdescription tone theme page enablevoice enablenavigation",
                )

                if (!user) {
                        return res.status(404).json({ message: "Widget assistant not found" })
                }

                return res.status(200).json({
                        assistantname: user.assistantname,
                        businessname: user.businessname,
                        businesstype: user.businesstype,
                        businessdescription: user.businessdescription,
                        tone: user.tone,
                        theme: user.theme,
                        pages: user.page,
                        enablevoice: user.enablevoice,
                        enablenavigation: user.enablenavigation,
                })
        } catch (error) {
                return res.status(500).json({ message: `Failed to load widget config ${error.message}` })
        }
}

export const voiceWidgetScript = async (req, res) => {
        const script = `(() => {
            const currentScript = document.currentScript || Array.from(document.getElementsByTagName('script')).pop();
            if (!currentScript) return;

            const dataset = currentScript.dataset || {};
            const userId = dataset.userId || dataset.assistantId;
            const apiBase = dataset.apiBase || currentScript.src.replace(/\/widget\/voice-agent\.js.*$/, '');
            const position = dataset.position || 'bottom-right';
            const fallbackTheme = (dataset.theme || 'dark').toLowerCase();

            if (!userId) {
                console.error('[Shifra Voice AI] Missing data-user-id on embed script.');
                return;
            }

            if (document.getElementById('shifra-voice-ai-root')) return;

            const root = document.createElement('div');
            root.id = 'shifra-voice-ai-root';
            root.style.all = 'initial';
            root.style.position = 'fixed';
            root.style.zIndex = '2147483647';
            root.style.fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            root.style.bottom = position.includes('bottom') ? '24px' : 'auto';
            root.style.top = position.includes('top') ? '24px' : 'auto';
            root.style.right = position.includes('right') ? '24px' : 'auto';
            root.style.left = position.includes('left') ? '24px' : 'auto';
            document.body.appendChild(root);

            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = 'Voice Assistant';
            button.style.border = 'none';
            button.style.borderRadius = '999px';
            button.style.padding = '14px 18px';
            button.style.cursor = 'pointer';
            button.style.fontWeight = '700';
            button.style.boxShadow = '0 18px 40px rgba(15, 23, 42, 0.28)';
            button.style.color = fallbackTheme === 'light' ? '#0f172a' : '#020617';
            button.style.background = fallbackTheme === 'light' ? '#e2e8f0' : '#22d3ee';

            const panel = document.createElement('div');
            panel.style.display = 'none';
            panel.style.width = 'min(360px, calc(100vw - 32px))';
            panel.style.marginTop = '12px';
            panel.style.borderRadius = '24px';
            panel.style.overflow = 'hidden';
            panel.style.border = '1px solid rgba(148, 163, 184, 0.18)';
            panel.style.boxShadow = '0 30px 80px rgba(2, 6, 23, 0.28)';
            panel.style.backdropFilter = 'blur(24px)';
            panel.style.background = fallbackTheme === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(15, 23, 42, 0.96)';
            panel.style.color = fallbackTheme === 'light' ? '#0f172a' : '#ffffff';

            panel.innerHTML = '<div style="padding:18px;"><div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.7;margin-bottom:8px;">Shifra Voice AI</div><div id="shifra-widget-body" style="font-size:14px;line-height:1.6;opacity:.92;">Loading assistant...</div><div style="margin-top:14px;display:flex;gap:8px;"><input id="shifra-widget-input" placeholder="Say something..." style="flex:1;border:1px solid rgba(148,163,184,.24);border-radius:14px;padding:12px 14px;font:inherit;outline:none;background:transparent;color:inherit;" /><button id="shifra-widget-send" type="button" style="border:none;border-radius:14px;padding:12px 14px;font:inherit;font-weight:700;cursor:pointer;background:#22d3ee;color:#020617;">Send</button></div></div>';

            root.appendChild(button);
            root.appendChild(panel);

            let config = null;

            const renderConfig = (data) => {
                config = data;
                const body = panel.querySelector('#shifra-widget-body');
                if (body) {
                    body.innerHTML = '<div style="font-weight:700;font-size:16px;margin-bottom:6px;">' + (data.assistantname || 'Voice Assistant') + '</div>' + '<div>' + (data.businessdescription || 'Your assistant is ready to use on this site.') + '</div>' + '<div style="margin-top:12px;font-size:12px;opacity:.75;">User ID: ' + userId + '</div>';
                }
            };

            const loadConfig = async () => {
                try {
                    const response = await fetch(apiBase + '/widget/' + encodeURIComponent(userId));
                    if (!response.ok) throw new Error('Widget config request failed');
                    const data = await response.json();
                    renderConfig(data);
                } catch (error) {
                    const body = panel.querySelector('#shifra-widget-body');
                    if (body) {
                        body.textContent = 'Unable to load the assistant widget.';
                    }
                    console.error('[Shifra Voice AI]', error);
                }
            };

            button.addEventListener('click', () => {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                if (!config) {
                    loadConfig();
                }
            });

            panel.addEventListener('click', (event) => {
                const target = event.target;
                if (target && target.id === 'shifra-widget-send') {
                    const input = panel.querySelector('#shifra-widget-input');
                    const body = panel.querySelector('#shifra-widget-body');
                    if (input && body && input.value.trim()) {
                        const message = input.value.trim();
                        body.innerHTML = '<div style="font-weight:700;font-size:16px;margin-bottom:6px;">' + (config?.assistantname || 'Voice Assistant') + '</div><div style="margin-bottom:10px;">You said: ' + message + '</div><div style="opacity:.8;">This is your embed shell. Connect it to your chat/voice backend from here.</div>';
                        input.value = '';
                    }
                }
            });
        })();`

        res.setHeader("Content-Type", "application/javascript; charset=utf-8")
        return res.status(200).send(script)
}