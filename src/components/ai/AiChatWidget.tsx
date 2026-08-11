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
    const msg = userMessage.toLowerCase().trim();

    // --- Greetings ---
    if (/^(hi|hey|hello|sup|yo|hola|howdy|what'?s up)\b/.test(msg)) {
      return "Hey there! 👋 I'm your TypeArena typing coach. Ask me about improving your speed, accuracy, finger placement, or practice routines. What would you like to work on?";
    }

    // --- Conversational / acknowledgement ---
    if (/^(ok|okay|sure|cool|thanks|thank you|thx|got it|nice|great|good|alright|np|yep|yes|no|nah)\b/.test(msg) && msg.length < 30) {
      return "Glad to help! Feel free to ask me anything about typing — speed tips, accuracy tricks, finger placement, practice drills, or your weak key analysis. I'm here whenever you need me! 😊";
    }

    // --- Speed / WPM ---
    if (msg.includes("faster") || msg.includes("speed") || msg.includes("wpm") || msg.includes("quick") || msg.includes("slow")) {
      return "Focus on accuracy first — speed follows naturally! Keep your fingers on the home row (ASDF JKL;), type without looking at the keyboard, and practice 15-30 minutes daily. Consistency beats intensity. Try our Lessons page for structured drills! 🚀";
    }

    // --- Weak keys / analyze ---
    if (msg.includes("weak key") || msg.includes("analyze") || msg.includes("worst key") || msg.includes("hardest key") || msg.includes("difficult key")) {
      if (weakKeysContext && !weakKeysContext.includes("No significant")) {
        return `Based on your typing history, your weakest keys are: ${weakKeysContext}. I recommend doing targeted drills focusing on words containing these keys. Try the Practice page for auto-generated weak-key exercises! 🎯`;
      }
      return "You don't have enough typing data yet to identify weak keys. Complete a few more tests and I'll be able to pinpoint exactly which keys need work! Keep practicing! 💪";
    }

    // --- Practice / drills ---
    if (msg.includes("drill") || msg.includes("practice") || msg.includes("exercise") || msg.includes("warm up") || msg.includes("routine")) {
      return "Here's a quick drill: type 'the quick brown fox jumps over the lazy dog' 5 times focusing on zero errors. Then try our Lessons page — it has structured exercises from beginner home row keys all the way to advanced symbols and numbers! 📝";
    }

    // --- Accuracy / errors ---
    if (msg.includes("accuracy") || msg.includes("error") || msg.includes("mistake") || msg.includes("typo") || msg.includes("mistype")) {
      return "For better accuracy: slow down by 10-15% from your max speed, focus on hitting each key cleanly, and resist the urge to rush. Use 'Stop on Error' mode in test settings to build discipline. Accuracy above 96% should be your baseline before pushing speed. 🎯";
    }

    // --- Finger placement / posture ---
    if (msg.includes("finger") || msg.includes("position") || msg.includes("home row") || msg.includes("posture") || msg.includes("hand") || msg.includes("wrist") || msg.includes("ergonomic")) {
      return "Proper finger placement is crucial! Rest your left hand on A-S-D-F and right hand on J-K-L-;. Feel the bumps on F and J — those are your anchor keys. Keep wrists neutral and slightly elevated. Check our Beginner Lesson 1(a) for a guided home row tutorial! ⌨️";
    }

    // --- How long / improvement timeline ---
    if (msg.includes("how long") || msg.includes("improve") || msg.includes("progress") || msg.includes("better") || msg.includes("get good")) {
      return "Most people see noticeable improvement within 2-3 weeks of daily 20-minute practice. Going from 30→50 WPM takes 2-4 weeks; 50→70 WPM takes another month. The key is consistency — daily short sessions beat weekly marathons! 📈";
    }

    // --- Keyboard layout ---
    if (msg.includes("dvorak") || msg.includes("colemak") || msg.includes("qwerty") || msg.includes("layout") || msg.includes("keyboard type")) {
      return "QWERTY is the most common layout and great for beginners. Dvorak and Colemak are designed for efficiency but have a steep learning curve. Stick with QWERTY unless you have a specific reason to switch — your speed gains will come from technique, not layout! ⌨️";
    }

    // --- Touch typing ---
    if (msg.includes("touch typ") || msg.includes("without looking") || msg.includes("blind typ") || msg.includes("look at keyboard")) {
      return "Touch typing means typing without looking at the keyboard. Start by memorizing the home row (ASDF JKL;), then gradually add new keys. Cover your keyboard with a cloth if needed! Our Beginner Lessons guide you through this step by step. 👀";
    }

    // --- Lessons ---
    if (msg.includes("lesson") || msg.includes("course") || msg.includes("learn") || msg.includes("beginner") || msg.includes("start")) {
      return "Check out our Lessons page! We have Beginner lessons (home row → full alphabet) and Advanced lessons (speed drills, symbols, numbers). Each lesson has 3 exercises with progressively harder text. Start with Beginner Lesson 1(a) if you're new! 📚";
    }

    // --- Consistency ---
    if (msg.includes("consisten") || msg.includes("rhythm") || msg.includes("steady") || msg.includes("even")) {
      return "Typing consistency means maintaining an even rhythm without speed spikes and dips. Try to type at a constant pace rather than bursting and pausing. Think of it like a metronome — smooth and steady wins the race! 🎵";
    }

    // --- Backspace / correction habits ---
    if (msg.includes("backspace") || msg.includes("delete") || msg.includes("correct") || msg.includes("fix")) {
      return "Excessive backspacing kills your WPM. If your raw WPM is much higher than your net WPM, you're over-correcting. Try 'Stop on Error: Word' mode to train accuracy without the backspace crutch. Build clean keystrokes from the start! 🚫";
    }

    // --- Off-topic detection ---
    if (msg.includes("weather") || msg.includes("music") || msg.includes("movie") || msg.includes("game") || msg.includes("food") ||
        msg.includes("song") || msg.includes("play") || msg.includes("cook") || msg.includes("sport") || msg.includes("tabla") ||
        msg.includes("guitar") || msg.includes("dance") || msg.includes("news") || msg.includes("joke") || msg.includes("math") ||
        msg.includes("science") || msg.includes("history") || msg.includes("code") || msg.includes("program")) {
      return "I appreciate the curiosity, but I'm specifically trained as a typing coach! 😄 I can help you with: typing speed, accuracy, finger placement, practice drills, weak key analysis, and lesson recommendations. What typing topic can I help with?";
    }

    // --- Questions we don't understand ---
    if (msg.includes("?") || msg.length > 15) {
      return "Hmm, I'm not sure about that one — I'm specialized in typing coaching! I can help with: 🚀 Speed tips, 🎯 Accuracy improvement, ⌨️ Finger placement, 📝 Practice drills, 🔍 Weak key analysis, and 📚 Lesson recommendations. Try asking about one of these!";
    }

    return "I'm your typing coach! I can help with: 🚀 Speed tips, 🎯 Accuracy, ⌨️ Finger placement, 📝 Practice drills, 🔍 Weak key analysis, and 📚 Lessons. What would you like to work on?";
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
          return { key, errCount: Math.round(errCount as number), rate: (errCount as number) / total };
        })
        .filter((k) => k.errCount >= 1)
        .sort((a, b) => b.rate - a.rate || b.errCount - a.errCount)
        .slice(0, 5)
        .map((k) => `"${k.key.toUpperCase()}" — ${k.errCount} errors (${(k.rate * 100).toFixed(0)}% error rate)`);
        
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
