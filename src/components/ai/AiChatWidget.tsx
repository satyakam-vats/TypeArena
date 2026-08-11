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

  /** Generate a smart local response when Gemini API is unavailable */
  const getLocalResponse = (userMessage: string, weakKeysContext: string): string => {
    const msg = userMessage.toLowerCase();

    if (msg.includes("faster") || msg.includes("speed") || msg.includes("wpm")) {
      return "Focus on accuracy first — speed follows naturally! Keep your fingers on the home row (ASDF JKL;), type without looking at the keyboard, and practice 15-30 minutes daily. Consistency beats intensity. Try our Lessons page for structured drills! 🚀";
    }
    if (msg.includes("weak key") || msg.includes("analyze")) {
      if (weakKeysContext && !weakKeysContext.includes("No significant")) {
        return `Based on your typing history, your weakest keys are: ${weakKeysContext}. I recommend doing targeted drills focusing on words containing these keys. Try the Practice page for auto-generated weak-key exercises! 🎯`;
      }
      return "You don't have enough typing data yet to identify weak keys. Complete a few more tests and I'll be able to pinpoint exactly which keys need work! Keep practicing! 💪";
    }
    if (msg.includes("drill") || msg.includes("practice") || msg.includes("exercise")) {
      return "Here's a quick drill: type 'the quick brown fox jumps over the lazy dog' 5 times focusing on zero errors. Then try our Lessons page — it has structured exercises from beginner home row keys all the way to advanced symbols and numbers! 📝";
    }
    if (msg.includes("accuracy") || msg.includes("error") || msg.includes("mistake")) {
      return "For better accuracy: slow down by 10-15% from your max speed, focus on hitting each key cleanly, and resist the urge to rush. Use 'Stop on Error' mode in test settings to build discipline. Accuracy above 96% should be your baseline before pushing speed. 🎯";
    }
    if (msg.includes("finger") || msg.includes("position") || msg.includes("home row") || msg.includes("posture")) {
      return "Proper finger placement is crucial! Rest your left hand on A-S-D-F and right hand on J-K-L-;. Feel the bumps on F and J — those are your anchor keys. Each finger is responsible for specific keys. Check our Beginner Lesson 1(a) for a guided home row tutorial! ⌨️";
    }
    if (msg.includes("how long") || msg.includes("time") || msg.includes("improve")) {
      return "Most people see noticeable improvement within 2-3 weeks of daily 20-minute practice. Going from 30 to 50 WPM typically takes 2-4 weeks; 50 to 70 WPM takes another month. The key is consistency — daily short sessions beat weekly marathons! 📈";
    }
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      return "Hey there! 👋 I'm here to help you become a better typist. You can ask me about typing techniques, practice strategies, or how to fix specific problems. What would you like to work on?";
    }
    return "Great question! Here are my top tips: 1) Practice daily for at least 15 minutes, 2) Focus on accuracy before speed, 3) Use proper finger placement on the home row, and 4) Try our structured Lessons for progressive skill building. What specific area would you like to improve? 💡";
  };

  const callGemini = async (userMessage: string, weakKeysContext: string = "") => {
    const apiKey = getGeminiApiKey();

    setIsTyping(true);

    // If no API key, use local AI responses directly
    if (!apiKey) {
      // Small delay to feel natural
      await new Promise((r) => setTimeout(r, 600));
      const localReply = getLocalResponse(userMessage, weakKeysContext);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "ai", text: localReply },
      ]);
      setIsTyping(false);
      return;
    }

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
      console.warn("Gemini chat error, falling back to local AI:", err);
      // Fallback to local AI response instead of showing error
      const localReply = getLocalResponse(userMessage, weakKeysContext);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "ai", text: localReply },
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
