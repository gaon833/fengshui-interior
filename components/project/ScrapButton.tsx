"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ENGAGEMENT_EVENT, isScrapped, toggleScrap, type ScrapItem } from "@/lib/engagement";
import styles from "./ScrapButton.module.css";

type Props = { item: Omit<ScrapItem, "savedAt">; className?: string; label?: string };
type Feedback = "saved" | "removed" | null;

export default function ScrapButton({ item, className = "", label }: Props) {
  const [active, setActive] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [portalReady, setPortalReady] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setPortalReady(true);

    const sync = () => setActive(isScrapped(item.id));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ENGAGEMENT_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ENGAGEMENT_EVENT, sync);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [item.id]);

  useEffect(() => {
    if (!feedback) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFeedback(null);
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [feedback]);

  const showFeedback = (next: Exclude<Feedback, null>) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setFeedback(next);
    timerRef.current = window.setTimeout(() => setFeedback(null), 1800);
  };

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const saved = toggleScrap(item);
    setActive(saved);
    showFeedback(saved ? "saved" : "removed");
  };

  return (
    <>
      <button
        type="button"
        className={`scrap-heart${active ? " is-active" : ""} ${className}`.trim()}
        aria-label={active ? "스크랩 해제" : "스크랩 저장"}
        aria-pressed={active}
        onClick={onClick}
      >
        <svg aria-hidden="true" viewBox="0 0 32 29" focusable="false">
          <path d="M16 27.2 3.1 14.8C-4.1 7.9 1.1-2.8 10.2.7 12.7 1.6 14.7 3.5 16 5.9 17.3 3.5 19.3 1.6 21.8.7c9.1-3.5 14.3 7.2 7.1 14.1L16 27.2Z" />
        </svg>
        {label && <em>{label}</em>}
      </button>

      {feedback && portalReady && createPortal(
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setFeedback(null);
          }}
        >
          <section className={styles.modal} role="status" aria-live="polite" aria-label="스크랩 안내">
            <svg className={styles.icon} aria-hidden="true" viewBox="0 0 32 29" focusable="false">
              <path d="M16 27.2 3.1 14.8C-4.1 7.9 1.1-2.8 10.2.7 12.7 1.6 14.7 3.5 16 5.9 17.3 3.5 19.3 1.6 21.8.7c9.1-3.5 14.3 7.2 7.1 14.1L16 27.2Z" />
            </svg>

            <p className={styles.message}>
              {feedback === "saved" ? "SCRAP에 저장되었습니다." : "SCRAP에서 삭제되었습니다."}
            </p>

            {feedback === "saved" ? (
              <Link className={styles.action} href="/scrap/" onClick={() => setFeedback(null)}>
                <span>SCRAP 바로가기</span>
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <button className={styles.action} type="button" onClick={() => setFeedback(null)}>
                <span>확인</span>
                <span aria-hidden="true">→</span>
              </button>
            )}
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
