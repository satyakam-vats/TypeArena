import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Brain, Loader2, Key, Sparkles } from "lucide-react";
import {
  getGeminiApiKey,
  setGeminiApiKey,
  hasGeminiApiKey,
} from "../../lib/ai/geminiClient";
import { getAllTimeKeyStatsFromStorage } from "../../lib/storage/analyticsStorage";

type Message = {
  id: string;
  role: "ai" | "user" | "system";
  text: string;
  isError?: boolean;
};

const INITIAL_MESSAGE: Message = {
  id: "greeting",
  role: "ai",
  text: "Hey! I'm your AI typing coach. Ask me anything about improving your typing speed, accuracy, or technique!",
};

const SUGGESTIONS = [
  "How can I type faster?",
  "Analyze my weak keys",
  "Give me a practice drill",
];

const SYSTEM_PROMPT = `You are TypeArena's AI typing coach. You help users improve their typing speed and accuracy. Keep responses concise (2-4 sentences max). Be encouraging and practical. You can suggest practice drills, explain typing techniques, and give personalized tips.`;

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Key setup state
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [tempKey, setTempKey] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      setGeminiApiKey(tempKey.trim());
      setShowKeySetup(false);
      setTempKey("");
      // Add success message
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "system", text: "API Key saved successfully! You can now chat with your coach." },
      ]);
    }
  };

  const callGemini = async (userMessage: string, weakKeysContext: string = "") => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "system",
          text: "Connect your free Gemini API key to start chatting! Get one at aistudio.google.com/apikey",
        },
      ]);
      setShowKeySetup(true);
      return;
    }

    setIsTyping(true);

    try {
      // Build conversation history
      const historyParts = messages
        .filter((m) => m.role !== "system" && !m.isError)
        .map((m) => ({
          role: m.role === "ai" ? "model" : "user",
          parts: [{ text: m.text }],
        }));

      let finalUserMessage = userMessage;
      if (weakKeysContext) {
        finalUserMessage += `\n\n[System Context: The user's weak keys data is: ${weakKeysContext}]`;
      }

      historyParts.push({
        role: "user",
        parts: [{ text: finalUserMessage }],
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: historyParts,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiText) {
        throw new Error("Empty response from AI");
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "ai", text: aiText.trim() },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "system",
          text: "Failed to get response. Please check your API key or try again later.",
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const newMessageId = Date.now().toString();
    setMessages((prev) => [...prev, { id: newMessageId, role: "user", text }]);
    setInput("");

    let weakKeysContext = "";
    if (text === "Analyze my weak keys") {
      const stats = getAllTimeKeyStatsFromStorage();
      
      const weakKeysArr = Object.entries(stats.keyErrors)
        .map(([key, errCount]) => {
          const total = stats.keyTotals[key] || errCount || 1;
          return { key, errCount, rate: errCount / total };
        })
        .sort((a, b) => b.rate - a.rate || b.errCount - a.errCount)
        .slice(0, 5)
        .map((k) => `${k.key} (${k.errCount} errors, ${(k.rate * 100).toFixed(1)}% error rate)`);
        
      weakKeysContext = weakKeysArr.length > 0 
        ? weakKeysArr.join(", ") 
        : "No significant weak keys detected yet.";
    }

    await callGemini(text, weakKeysContext);
  };

  return (
    <div className="ai-chat-widget">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          className="ai-chat-fab"
          onClick={handleOpen}
          aria-label="Open AI Coach Chat"
        >
          <div className="ai-chat-fab-pulse"></div>
          <Brain size={24} />
          {unreadCount > 0 && (
            <span className="ai-chat-badge">{unreadCount}</span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      <div className={`ai-chat-panel ${isOpen ? "is-open" : ""}`}>
        <div className="ai-chat-header">
          <div className="ai-chat-header-title">
            <Brain size={18} />
            <span>AI Coach Chat</span>
          </div>
          <button
            className="ai-chat-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close Chat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-chat-msg ai-chat-msg--${msg.role} ${msg.isError ? "is-error" : ""}`}>
              {msg.role === "ai" && <Brain size={14} className="ai-chat-msg-icon" />}
              {msg.role === "system" && !msg.isError && <Sparkles size={14} className="ai-chat-msg-icon" />}
              <div className="ai-chat-msg-bubble">
                <p>{msg.text}</p>
                {msg.role === "system" && msg.text.includes("aistudio") && !showKeySetup && (
                  <button className="ai-chat-setup-btn" onClick={() => setShowKeySetup(true)}>
                    <Key size={12} /> Setup API Key
                  </button>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="ai-chat-msg ai-chat-msg--ai">
              <Brain size={14} className="ai-chat-msg-icon" />
              <div className="ai-chat-msg-bubble ai-chat-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          {showKeySetup && (
            <div className="ai-chat-key-setup">
              <p>Enter your Gemini API Key:</p>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIzaSy..."
                autoFocus
              />
              <div className="ai-chat-key-actions">
                <button onClick={() => setShowKeySetup(false)} className="btn-cancel">Cancel</button>
                <button onClick={handleSaveKey} className="btn-save">Save Key</button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && !isTyping && !showKeySetup && (
          <div className="ai-chat-suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                className="ai-chat-chip"
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="ai-chat-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend(input);
              }
            }}
            placeholder="Ask your coach..."
            disabled={isTyping}
          />
          <button
            className="ai-chat-send"
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
          >
            {isTyping ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
