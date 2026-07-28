"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']"));
}

export default function PublicContentProtection({ children }: { children: ReactNode }) {
  useEffect(() => {
    const isInsidePublicArea = (target: EventTarget | null) =>
    target instanceof Node && Boolean(document.querySelector(".public-content-protection")?.contains(target));

  const prevent = (event: Event) => {
      if (isInsidePublicArea(event.target)) event.preventDefault();
    };

    const preventSelection = (event: Event) => {
      if (isInsidePublicArea(event.target) && !isEditableTarget(event.target)) event.preventDefault();
    };

    const preventClipboard = (event: ClipboardEvent) => {
      if (isInsidePublicArea(event.target) && !isEditableTarget(event.target)) event.preventDefault();
    };

    const preventProtectedShortcuts = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;
      const blocked =
        event.key === "F12" ||
        (ctrlOrMeta && ["a", "c", "s", "u", "x"].includes(key)) ||
        (ctrlOrMeta && event.shiftKey && ["i", "j", "c"].includes(key));

      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", prevent);
    document.addEventListener("dragstart", prevent);
    document.addEventListener("selectstart", preventSelection);
    document.addEventListener("copy", preventClipboard);
    document.addEventListener("cut", preventClipboard);
    document.addEventListener("keydown", preventProtectedShortcuts, true);

    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("selectstart", preventSelection);
      document.removeEventListener("copy", preventClipboard);
      document.removeEventListener("cut", preventClipboard);
      document.removeEventListener("keydown", preventProtectedShortcuts, true);
    };
  }, []);

  return <div className="public-content-protection">{children}</div>;
}
