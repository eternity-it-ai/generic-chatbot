import { useEffect } from "react";

export function useProductionMode() {
  useEffect(() => {
    // Disable browser-like behaviors in production, but allow text selection and copying
    if (import.meta.env.PROD) {
      document.body.classList.add("production-mode");
      
      const handleContextMenu = (e: MouseEvent) => {
        // Allow context menu on selectable content (messages, text areas, etc.)
        const target = e.target as HTMLElement;
        const isSelectable = 
          target.closest('.markdown-content') ||
          target.closest('[data-selectable="true"]') ||
          target.closest('textarea') ||
          target.closest('input') ||
          target.isContentEditable;
        
        if (!isSelectable) {
          e.preventDefault();
        }
      };
      
      const handleKeyDown = (e: KeyboardEvent) => {
        // Disable search (Cmd/Ctrl + F)
        if ((e.metaKey || e.ctrlKey) && e.key === "f") e.preventDefault();
        // Disable print (Cmd/Ctrl + P)
        if ((e.metaKey || e.ctrlKey) && e.key === "p") e.preventDefault();
        // Allow copy (Cmd/Ctrl + C) - don't prevent it
      };

      document.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);
}
