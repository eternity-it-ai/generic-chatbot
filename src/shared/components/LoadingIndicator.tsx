import { useState, useEffect } from "react";

interface LoadingIndicatorProps {
  messages?: string[];
}

export default function LoadingIndicator({
  messages = [
    "Analyzing your message...",
    "Processing request...",
    "Preparing response...",
    "Almost ready...",
  ],
}: LoadingIndicatorProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
        setIsAnimating(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-shimmer { 
          animation: shimmer 2s linear infinite; 
        }
      `}</style>

      <div
        className="flex w-full mb-6 justify-start"
        role="status"
        aria-live="polite"
        aria-label="Assistant is generating a response"
        style={{ animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="flex items-start gap-4 max-w-[85%]">
          {/* Avatar with animated ring */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-white animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20" />
          </div>

          {/* Message bubble with cycling text */}
          <div className="relative rounded-2xl rounded-tl-md bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 px-5 py-4 shadow-lg shadow-gray-200/50 w-[min(540px,100%)]">
            <div className="relative h-6 overflow-hidden">
              <div
                className={`transition-all duration-500 ${
                  isAnimating
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-4"
                }`}
              >
                <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
                  {messages[currentIndex]}
                </span>
              </div>
            </div>

            {/* Decorative accent */}
            <div className="absolute -bottom-1 -right-1 w-20 h-20 bg-gradient-to-br from-purple-400/10 to-indigo-400/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </>
  );
}
