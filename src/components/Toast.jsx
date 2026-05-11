import React, { useEffect } from "react";

export default function Toast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const id = setTimeout(onDismiss, 2400);
    return () => clearTimeout(id);
  }, [message, onDismiss]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && <div className="toast">{message}</div>}
    </div>
  );
}
