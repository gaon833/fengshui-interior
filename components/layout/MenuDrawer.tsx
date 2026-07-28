"use client";

import { useEffect, useId, useRef, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import NavigationList from "@/components/navigation/NavigationList";

type MenuDrawerProps = {
  variant?: "site" | "detail";
  useBackdrop?: boolean;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function MenuDrawer({ variant = "site", useBackdrop = false }: MenuDrawerProps) {
  const [open, setOpen] = useState(false);
  const reactId = useId().replace(/:/g, "");
  const drawerId = `${variant}-drawer-${reactId}`;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [];
    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      toggleRef.current?.focus();
    };
  }, [open]);

  return (
    <div className={`menu-drawer-controller menu-drawer-controller--${variant}`}>
      <button
        ref={toggleRef}
        className={`menu-toggle${open ? " is-open" : ""}`}
        type="button"
        aria-expanded={open}
        aria-controls={drawerId}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        onClick={() => setOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && useBackdrop && (
        <button
          className="drawer-backdrop is-open"
          type="button"
          aria-label="메뉴 닫기"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        ref={drawerRef}
        id={drawerId}
        className={`menu-drawer${open ? " is-open" : ""}`}
        aria-hidden={!open}
        aria-modal="true"
        aria-label="전체 메뉴"
        role="dialog"
      >
        <BrandLogo className="drawer-logo" />
        <button
          className="drawer-close"
          type="button"
          aria-label="메뉴 닫기"
          onClick={() => setOpen(false)}
        >
          <span />
          <span />
        </button>
        <NavigationList onNavigate={() => setOpen(false)} />
      </aside>
    </div>
  );
}
