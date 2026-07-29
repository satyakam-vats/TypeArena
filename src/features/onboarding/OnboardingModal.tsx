import { useState } from "react";
import { Keyboard, Target, Swords, LineChart, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function shouldShowOnboarding(): boolean {
  return localStorage.getItem("typearena_onboarded_v1") !== "true";
}

const STEPS = [
  {
    title: "Welcome to TypeArena!",
    body: "The competitive typing test built for speed, accuracy, and fun. Ready to elevate your typing skills?",
    icon: <Keyboard className="onboarding-icon" style={{ color: "var(--accent)" }} />,
  },
  {
    title: "Type to improve",
    body: "Practice your typing in solo mode. Choose between time and words modes, and even set a custom test length to match your goals.",
    icon: <Target className="onboarding-icon" style={{ color: "var(--accent)" }} />,
  },
  {
    title: "Challenge friends",
    body: "Enter Race Mode to compete with friends in real-time. Create a room, share the code, and prove who has the fastest fingers.",
    icon: <Swords className="onboarding-icon" style={{ color: "var(--accent)" }} />,
  },
  {
    title: "Analytics & Achievements",
    body: "Track your progress over time with detailed analytics, earn badges for your milestones, and climb the global leaderboard.",
    icon: <LineChart className="onboarding-icon" style={{ color: "var(--accent)" }} />,
  }
];

export function OnboardingModal({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleSkip = () => {
    localStorage.setItem("typearena_onboarded_v1", "true");
    onDismiss();
  };

  const handleFinish = () => {
    localStorage.setItem("typearena_onboarded_v1", "true");
    onDismiss();
    navigate("/");
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div style={{ textAlign: "center" }}>
          {currentStep.icon}
          <h2 className="onboarding-title">{currentStep.title}</h2>
          <p className="onboarding-body">{currentStep.body}</p>
        </div>
        
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`onboarding-dot ${i === step ? "active" : ""}`} />
          ))}
        </div>

        <div className="onboarding-actions">
          <button className="onboarding-skip" onClick={handleSkip}>
            Skip
          </button>
          <button className="primary-button" onClick={nextStep}>
            {step === STEPS.length - 1 ? "Start Typing!" : (
              <>Next <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
