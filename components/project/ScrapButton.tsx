"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ENGAGEMENT_EVENT, isScrapped, toggleScrap, type ScrapItem } from "@/lib/engagement";

type Props = { item: Omit<ScrapItem, "savedAt">; className?: string; label?: string };

export default function ScrapButton({ item, className = "", label }: Props) {
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("");
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    const sync = () => setActive(isScrapped(item.id));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ENGAGEMENT_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ENGAGEMENT_EVENT, sync);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [item.id]);

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.stopPropagation();
    const saved = toggleScrap(item);
    setActive(saved);
    setMessage(saved ? "SCRAP에 저장되었습니다." : "SCRAP에서 삭제되었습니다.");
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMessage(""), saved ? 2400 : 1700);
  };

  return <>
    <button type="button" className={`scrap-heart${active ? " is-active" : ""} ${className}`.trim()} aria-label={active ? "스크랩 해제" : "스크랩"} aria-pressed={active} onClick={onClick}>
      <svg aria-hidden="true" viewBox="0 0 32 29" focusable="false">
        <path d="M16 27.2 3.1 14.8C-4.1 7.9 1.1-2.8 10.2.7 12.7 1.6 14.7 3.5 16 5.9 17.3 3.5 19.3 1.6 21.8.7c9.1-3.5 14.3 7.2 7.1 14.1L16 27.2Z" />
      </svg>{label && <em>{label}</em>}
    </button>
    {message && (
      <div className="scrap-save-feedback" role="status" aria-live="polite">
        <span>{message}</span>
        {active && <Link href="/scrap" onClick={() => setMessage("")}>SCRAP 바로가기</Link>}
      </div>
    )}
  </>;
}
