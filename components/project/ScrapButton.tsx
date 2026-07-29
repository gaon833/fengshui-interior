"use client";

import { useEffect, useState } from "react";
import { ENGAGEMENT_EVENT, isScrapped, toggleScrap, type ScrapItem } from "@/lib/engagement";

type Props = { item: Omit<ScrapItem, "savedAt">; className?: string; label?: string };

export default function ScrapButton({ item, className = "", label }: Props) {
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const sync = () => setActive(isScrapped(item.id));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ENGAGEMENT_EVENT, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(ENGAGEMENT_EVENT, sync); };
  }, [item.id]);

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.stopPropagation();
    const saved = toggleScrap(item);
    setActive(saved);
    setMessage(saved ? "스크랩되었습니다." : "스크랩이 해제되었습니다.");
    window.setTimeout(() => setMessage(""), 1700);
  };

  return <>
    <button type="button" className={`scrap-heart${active ? " is-active" : ""} ${className}`.trim()} aria-label={active ? "스크랩 해제" : "스크랩"} aria-pressed={active} onClick={onClick}>
      <span aria-hidden="true">{active ? "♥" : "♡"}</span>{label && <em>{label}</em>}
    </button>
    {message && <div className="scrap-feedback" role="status">{message}</div>}
  </>;
}
