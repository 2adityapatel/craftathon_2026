import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  X,
  Send,
  ShieldCheck,
  Trash2,
  Loader2,
  Lock,
  AlertTriangle,
  Server
} from "lucide-react";
import { useLanguage } from '../context/LanguageContext';

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

const SYSTEM_PROMPT = `You are a kind, calm support assistant for the Awaaz Safe Reporting System — a platform that helps people report online child exploitation safely and anonymously.

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
    "Hello. You've reached a safe, anonymous space. Nothing you share here is stored or logged — your privacy is fully protected.\n\nI'm here to help you understand or use the Awaaz Reporting System. You can ask me about anonymous reporting, how your data stays secure, how cases are tracked, or anything else about the system.\n\nTake your time. I'm here whenever you're ready.",
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

export default function AwaazChatbot() {
  const { lang } = useLanguage();
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
      {/* PROFESSIONAL FIX 1: Floating Icon Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open secure chat"
          className="btn-primary"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 50,
            width: 52,
            height: 52,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,186,59,0.2)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare size={22} style={{ color: 'var(--surface)' }} />
          
          {/* subtle unread indicator */}
          <span style={{ 
            position: 'absolute', top: -3, right: -3, width: 10, height: 10, 
            background: 'var(--primary)', border: '2px solid var(--surface)', borderRadius: '50%' 
          }} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="card-glass"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            width: '92vw',
            maxWidth: 420,
            height: '70vh',
            maxHeight: 640,
            minHeight: 400,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* PROFESSIONAL FIX 3: Header Architecture */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '16px 20px', background: 'var(--surface-high)', borderBottom: '1px solid var(--outline-variant)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 2, shrink: 0,
                background: 'rgba(255,186,59,0.1)', border: '1px solid rgba(255,186,59,0.25)'
              }}>
                <Server size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{
                    fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.9375rem',
                    color: 'var(--on-surface)', letterSpacing: '0.04em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {lang === 'hi' ? 'आवाज़ चैट' : 'Awaaz Chat'}
                  </h2>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 4, 
                    background: 'rgba(33,179,117,0.1)', padding: '2px 6px', borderRadius: 2, border: '1px solid rgba(33,179,117,0.2)' 
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgb(33,179,117)' }} className="animate-pulse" />
                    <span style={{ fontSize: '0.55rem', fontFamily: "'JetBrains Mono',monospace", color: 'rgb(44,212,141)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Lock size={10} style={{ color: 'var(--outline)' }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.625rem', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    End-to-end encrypted
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, shrink: 0 }}>
              <button
                onClick={() => setShowPanicConfirm(true)}
                title="Erase chat & close"
                style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: 'var(--tertiary)' }}
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: 'var(--outline)' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Panic Confirm */}
          {showPanicConfirm && (
            <div style={{
              background: 'rgba(255,113,98,0.08)', borderBottom: '1px solid rgba(255,113,98,0.2)',
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12
            }}>
              <AlertTriangle size={16} style={{ color: 'var(--tertiary)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--tertiary)', flex: 1, lineHeight: 1.4 }}>This will permanently erase this conversation.</p>
              <button onClick={panicClear} style={{ background: 'rgba(255,113,98,0.15)', color: 'var(--tertiary)', border: '1px solid rgba(255,113,98,0.3)', padding: '4px 10px', borderRadius: 2, fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer' }}>Erase</button>
              <button onClick={() => setShowPanicConfirm(false)} style={{ background: 'transparent', color: 'var(--outline)', border: '1px solid var(--outline-variant)', padding: '4px 10px', borderRadius: 2, fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer' }}>Cancel</button>
            </div>
          )}

          {/* PROFESSIONAL FIX 2 & 4: Messages, Avatars and Contrast */}
          <div
            ref={scrollRef}
            style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-end' }}>
                  
                  {/* Avatar for Bot only */}
                  {!isUser && (
                    <div style={{ 
                      width: 26, height: 26, borderRadius: 2, background: 'var(--surface-high)', 
                      border: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', flexShrink: 0, marginBottom: 2 
                    }}>
                      <ShieldCheck size={13} style={{ color: 'var(--primary)' }} />
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: '78%',
                      padding: '10px 14px',
                      fontSize: '0.8125rem',
                      lineHeight: 1.5,
                      borderRadius: 4,
                      position: 'relative',
                      ...(isUser
                        ? { 
                            background: 'var(--primary)', 
                            color: '#000000', // high contrast dark text against brand amber
                            borderBottomRightRadius: 0, 
                            fontWeight: 500,
                            boxShadow: '0 2px 4px rgba(255,186,59,0.1)'
                          }
                        : { 
                            background: 'var(--surface-high)', 
                            border: '1px solid var(--outline-variant)', 
                            color: 'var(--on-surface)', 
                            borderBottomLeftRadius: 0 
                          })
                    }}
                  >
                    {msg.content.split("\n").map((line, j) => (
                      <p key={j} style={{ marginTop: j > 0 ? 8 : 0 }}>{line}</p>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ 
                  width: 26, height: 26, borderRadius: 2, background: 'var(--surface-high)', 
                  border: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', flexShrink: 0, marginBottom: 2 
                }}>
                  <ShieldCheck size={13} style={{ color: 'var(--primary)' }} />
                </div>
                <div style={{ 
                  background: 'var(--surface-high)', border: '1px solid var(--outline-variant)', 
                  borderRadius: 4, borderBottomLeftRadius: 0, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 5 
                }}>
                  <span className="dot-warn animate-bounce" style={{ opacity: 0.6, width: 5, height: 5, animationDelay: '0ms' }} />
                  <span className="dot-warn animate-bounce" style={{ opacity: 0.6, width: 5, height: 5, animationDelay: '150ms' }} />
                  <span className="dot-warn animate-bounce" style={{ opacity: 0.6, width: 5, height: 5, animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Emergency Banner */}
          <div style={{ background: 'rgba(255,113,98,0.04)', borderTop: '1px solid rgba(255,113,98,0.15)', padding: '10px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>
               {lang === 'hi' ? 'तत्काल खतरे में हैं?' : 'In immediate danger?'} Call <strong style={{ color: 'var(--tertiary)' }}>1098</strong> (Child Helpline).
            </p>
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', background: 'var(--surface-highest)', borderTop: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={lang === 'hi' ? 'अपना संदेश टाइप करें...' : 'Type your message...'}
                rows={1}
                className="input-field"
                style={{ 
                  flex: 1, resize: 'none', padding: '12px 14px', maxHeight: 96, borderRadius: 2, 
                  background: 'var(--surface)', fontSize: '0.8125rem' 
                }}
                disabled={isTyping}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--surface)',
                  border: 'none',
                  borderRadius: 2,
                  padding: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  opacity: (!input.trim() || isTyping) ? 0.3 : 1,
                  cursor: (!input.trim() || isTyping) ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s'
                }}
              >
                {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} style={{ marginLeft: 2 }} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
