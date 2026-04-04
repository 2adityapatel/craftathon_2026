import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircleHeart,
  X,
  Send,
  ShieldCheck,
  Trash2,
  Loader2,
  Lock,
  AlertTriangle,
} from "lucide-react";

/*
 * ── Configuration ─────────────────────────────────────────────────────
 * MODE 1 (recommended): Route through the FastAPI backend proxy.
 *   Set VITE_CHAT_API_URL=http://localhost:8000/api/chat in your .env
 *
 * MODE 2 (hackathon fallback): Call Groq directly from the browser.
 *   Set VITE_GROQ_API_KEY=gsk_... in your .env
 *   NEVER hardcode the key in this file.
 *
 * The component auto-detects which mode to use.
 */
const BACKEND_URL = import.meta.env.VITE_CHAT_API_URL || "";
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const USE_BACKEND = !!BACKEND_URL;

const SYSTEM_PROMPT = `You are a kind, calm support assistant for the POCSO Safe Reporting System — a platform that helps people report online child exploitation safely and anonymously.

STRICT RULES:
1. Keep EVERY answer to 2-3 short sentences. Be warm but brief. Never write paragraphs.
2. Only discuss this reporting system and child safety. Politely decline anything else in one sentence.
3. Use simple, everyday language. Talk like a supportive friend, not a tech manual.
4. NEVER mention technical terms like encryption protocols, EXIF, AES, RSA, SHA-256, IPFS, blockchain hashes, metadata, NLP, OCR, Vision Transformers, API, or any specific technology name. If asked about security, just say "your data is fully protected" or "everything is encrypted and anonymous."
5. NEVER reveal how the system works internally. No architecture, no team details, no deployment info.
6. If someone is in danger, say: "Please call 1098 (Child Helpline) or your local emergency services right away." This comes first, always.

WHAT YOU KNOW (explain in simple words only when asked):
- Reporting is completely anonymous. No login, no email, no phone number needed.
- Nobody — not even us — can tell who submitted a report.
- You get a Case ID and a secret Case Key to check your report's progress anytime.
- Our AI automatically reviews every report and prioritizes the most urgent ones.
- It can understand text in Hindi, English, and Hinglish.
- It can even read text inside chat screenshots.
- Uploaded images and files are protected and stored securely off our servers.
- Every report is permanently recorded so nobody can delete or tamper with it.
- Authorities see a dashboard with cases sorted by urgency — most serious cases come first.
- Case status goes from Received to Under Review, Verified, Escalated, Action Taken, and finally Closed.

When someone asks "is my data safe?" just say something like:
"Yes, absolutely. Everything you share is encrypted and anonymous. We don't collect any personal information, and even our own servers can't identify you."

Be human. Be gentle. Be brief.`;


const WELCOME_MSG = {
  role: "assistant",
  content:
    "Hello. You've reached a safe, anonymous space. Nothing you share here is stored or logged — your privacy is fully protected.\n\nI'm here to help you understand or use the POCSO Reporting System. You can ask me about anonymous reporting, how your data stays secure, how cases are tracked, or anything else about the system.\n\nTake your time. I'm here whenever you're ready.",
};

async function callBackend(message, history) {
  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.reply;
}

async function callGroqDirect(message, history) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message },
  ];
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      max_tokens: 1024,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

export default function POCSOChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg = { role: "user", content: trimmed };
    const history = messages
      .filter((m) => m !== WELCOME_MSG)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const reply = USE_BACKEND
        ? await callBackend(trimmed, history)
        : await callGroqDirect(trimmed, history);

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry — I wasn't able to connect right now. Please try again in a moment. If this is an emergency, contact the 1098 Child Helpline immediately.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const panicClear = () => {
    setMessages([WELCOME_MSG]);
    setInput("");
    setIsTyping(false);
    setShowPanicConfirm(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open support chat"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 px-5 py-3.5 text-white shadow-lg shadow-slate-900/30 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 ring-1 ring-white/10"
        >
          <MessageCircleHeart size={22} className="text-teal-300" />
          <span className="text-sm font-medium tracking-wide">Safe Chat</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col w-[92vw] max-w-[420px] h-[70vh] max-h-[640px] min-h-[400px] rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/40 overflow-hidden"
          style={{ animation: "slideUp 0.3s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-800/80 border-b border-slate-700/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-teal-500/15 ring-1 ring-teal-400/30 shrink-0">
                <ShieldCheck size={18} className="text-teal-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-100 truncate">
                  POCSO Safe Reporting
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Lock size={10} className="text-teal-400/70" />
                  <span className="text-[11px] text-slate-400 tracking-wide">
                    End-to-end encrypted · Anonymous
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowPanicConfirm(true)}
                aria-label="Clear all data and close"
                title="Erase chat & close"
                className="p-2 rounded-lg text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Minimize chat"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Panic Confirm */}
          {showPanicConfirm && (
            <div className="px-4 py-3 bg-red-950/60 border-b border-red-500/20 flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-200 flex-1">
                This will permanently erase this conversation.
              </p>
              <button
                onClick={panicClear}
                className="px-3 py-1 rounded-md bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors"
              >
                Erase
              </button>
              <button
                onClick={() => setShowPanicConfirm(false)}
                className="px-3 py-1 rounded-md bg-slate-700/40 text-slate-300 text-xs font-medium hover:bg-slate-700/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-teal-600/25 text-teal-50 rounded-br-md border border-teal-500/15"
                      : "bg-slate-800/70 text-slate-200 rounded-bl-md border border-slate-700/40"
                  }`}
                >
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-2" : ""}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800/70 border border-slate-700/40 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400/70 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400/70 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Emergency Banner */}
          <div className="px-4 py-2 bg-amber-950/30 border-t border-amber-500/10">
            <p className="text-[11px] text-amber-200/60 text-center leading-snug">
              In immediate danger? Call{" "}
              <span className="font-semibold text-amber-300/80">1098</span>{" "}
              (Child Helpline) or local emergency services.
            </p>
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-1 bg-slate-900">
            <div className="flex items-center gap-2 rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-1 focus-within:border-teal-500/30 focus-within:ring-1 focus-within:ring-teal-500/10 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none py-2 outline-none max-h-24"
                disabled={isTyping}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="p-2 rounded-lg text-teal-400 hover:bg-teal-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {isTyping ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
