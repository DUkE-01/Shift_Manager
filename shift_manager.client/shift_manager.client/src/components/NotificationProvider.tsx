import React, { createContext, useContext, useCallback, useState, useEffect } from "react";

type ToastType = "success" | "error" | "info";
type Toast = { id: string; type: ToastType; message: string; duration?: number };

type Notify = {
  success: (msg: string, duration?: number) => void;
  error: (msg: string, duration?: number) => void;
  info: (msg: string, duration?: number) => void;
};

const NotificationContext = createContext<{ notify: Notify } | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications debe usarse dentro de NotificationProvider");
  return ctx;
}

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
    setToasts(t => [...t, { id, type, message, duration }]);
  }, []);

  const notify: Notify = {
    success: (m, d) => push("success", m, d),
    error: (m, d) => push("error", m, d),
    info: (m, d) => push("info", m, d),
  };

  useEffect(() => {
    const timers = toasts.map(t =>
      setTimeout(() => setToasts(curr => curr.filter(x => x.id !== t.id)), t.duration ?? 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  const dismiss = (id: string) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(t => (
          <div
            key={t.id}
            role="status"
            className={`max-w-sm w-full rounded-lg p-3 shadow-md flex items-start gap-3 border ${
              t.type === "success" ? "bg-green-50 border-green-200" :
              t.type === "error" ? "bg-red-50 border-red-200" :
              "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {t.type === "success" ? "Éxito" : t.type === "error" ? "Error" : "Info"}
              </div>
              <div className="text-sm text-gray-700 mt-1">{t.message}</div>
            </div>
            <button
              className="text-sm text-gray-500 px-2 py-1"
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}