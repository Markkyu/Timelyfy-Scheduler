import { useEffect, useState } from "react";

export default function AutoAllocatingOverlay({
  visible,
  status,
  errorMessage,
}) {
  const [logs, setLogs] = useState([]);
  const [dots, setDots] = useState("");

  const logMessages = [
    { text: "$ initializing schedule allocator...", delay: 0 },
    { text: "> analyzing timetable", delay: 1000 },
  ];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  useEffect(() => {
    if (!visible) {
      setLogs([]);
      setDots("");
      return;
    }

    // Add logs progressively
    logMessages.forEach((log) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, log]);
      }, log.delay);
    });

    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(dotsInterval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[1px] bg-black/40 animate-fadeIn">
      <div className="w-full max-w-2xl mx-4">
        {/* Terminal window */}
        <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
          {/* Terminal header */}
          <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-gray-400 text-sm ml-4 font-mono">
              Timelyfy schedule-allocator v1.0
            </span>
          </div>

          {/* Terminal content */}
          <div className="p-6 font-mono text-sm space-y-2 min-h-[300px]">
            {logs.map((log, index) => {
              return (
                <div key={index} className="animate-slideDown text-gray-300">
                  {log.text}
                </div>
              );
            })}
            {/* Status Message */}
            {status === "success" && (
              <div className="animate-slideDown text-green-400 font-mono text-sm">
                ✓ Slots found with courses!
              </div>
            )}
            {status === "empty" && (
              <div className="animate-slideDown text-yellow-400 font-mono text-sm">
                ⚠︎ No schedules could be allocated
              </div>
            )}
            {status === "error" && (
              <div className="animate-slideDown text-red-400 font-mono text-sm">
                ✖ Allocation failed: {errorMessage}
              </div>
            )}
            {!(
              status == "error" ||
              status == "success" ||
              status == "empty"
            ) && (
              <div className="text-blue-400 flex items-center gap-2">
                <div className="w-2 h-4 bg-blue-400 animate-pulse" />
                <span>Processing{dots}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
