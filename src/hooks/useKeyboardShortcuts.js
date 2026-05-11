import { useEffect } from "react";

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (isTypingTarget(e.target)) {
        // Only allow Escape inside inputs (to blur)
        if (e.key === "Escape" && handlers.onEscape) {
          handlers.onEscape(e);
        }
        return;
      }
      switch (e.key) {
        case "ArrowRight":
          if (handlers.onArrowRight) {
            e.preventDefault();
            handlers.onArrowRight();
          }
          break;
        case "ArrowLeft":
          if (handlers.onArrowLeft) {
            e.preventDefault();
            handlers.onArrowLeft();
          }
          break;
        case "r":
        case "R":
          if (handlers.onRandom) handlers.onRandom();
          break;
        case "s":
        case "S":
          if (handlers.onToggleShuffle) handlers.onToggleShuffle();
          break;
        case "f":
        case "F":
          if (handlers.onToggleFavorite) handlers.onToggleFavorite();
          break;
        case "/":
          if (handlers.onFocusSearch) {
            e.preventDefault();
            handlers.onFocusSearch();
          }
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
