import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  durationMs?: number;
}

export default function Toast({ message, type = "info", onClose, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  let bg = "bg-blue-600";
  if (type === "success") bg = "bg-green-600";
  if (type === "error") bg = "bg-red-600";

  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white ${bg} animate-fade-in`}
      role="alert"
      aria-live="assertive"
    >
      {message}
      <button
        onClick={onClose}
        className="ml-4 text-white font-bold"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
} 