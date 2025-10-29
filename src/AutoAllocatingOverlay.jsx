import { useEffect, useState } from "react";

export default function AutoAllocatingOverlay({ visible }) {
  const [stars, setStars] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const messages = [
    "Creating your schedules...",
    "Analyzing time slots...",
    "Optimizing allocations...",
    "Plotting your schedule...",
    "Finalizing details...",
    "Please wait a moment...",
  ];

  // Generate random floating stars
  useEffect(() => {
    const generateStars = Array.from({ length: 30 }).map((_, index) => ({
      id: index,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 2,
    }));
    setStars(generateStars);
  }, []);

  // Cycle through messages
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [visible, messages.length]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <style jsx="true">{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes float {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(0.8) translateY(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) translateY(-20px);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-float {
          animation: float 2.5s ease-in-out infinite;
        }

        .animate-scaleIn {
          animation: scaleIn 0.8s ease-out;
        }

        .animate-spin-slow {
          animation: spin 5s linear infinite;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Floating stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-yellow-300 shadow-lg animate-float"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: `${star.y}%`,
            left: `${star.x}%`,
            filter: "drop-shadow(0 0 6px rgba(255,255,150,0.8))",
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* Center message */}
      <div className="text-center text-white animate-scaleIn">
        <h1 className="text-4xl font-extrabold tracking-wide mb-4">
          Auto-allocating schedules
        </h1>

        {/* Animated message that changes */}
        <p
          key={currentMessageIndex}
          className="text-xl text-gray-300 animate-slideUp"
        >
          {messages[currentMessageIndex]}
        </p>

        {/* Loading dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div
            className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse-slow"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse-slow"
            style={{ animationDelay: "0.3s" }}
          />
          <div
            className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse-slow"
            style={{ animationDelay: "0.6s" }}
          />
        </div>
      </div>
    </div>
  );
}
