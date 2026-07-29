"use client";

import { useState } from "react";
import { trackEngagement } from "@/lib/engagement";

type Props = {
  projectSlug?: string;
  projectTitle: string;
  className?: string;
  fallbackPath?: string;
};

export default function ShareIconButton({ projectSlug, projectTitle, className = "", fallbackPath = "/gallery" }: Props) {
  const [message, setMessage] = useState("");

  const onShare = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const path = projectSlug
      ? `/project/view/?slug=${encodeURIComponent(projectSlug)}`
      : fallbackPath;
    const url = new URL(path, window.location.origin).toString();
    const canUseNativeShare = typeof navigator.share === "function";

    try {
      if (canUseNativeShare) {
        await navigator.share({
          title: `${projectTitle} | 풍수 인테리어`,
          text: `${projectTitle} 프로젝트를 확인해 보세요.`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }

      trackEngagement({
        type: "share",
        projectSlug: projectSlug || "gallery",
        projectTitle,
        target: projectSlug ? "project" : "image",
      });
      setMessage(canUseNativeShare ? "공유되었습니다." : "사이트 링크가 복사되었습니다.");
    } catch (error) {
      if ((error as Error).name !== "AbortError") setMessage("공유하지 못했습니다.");
    }

    window.setTimeout(() => setMessage(""), 1700);
  };

  return (
    <>
      <button
        type="button"
        className={`image-share-button ${className}`.trim()}
        aria-label={`${projectTitle} 사이트 링크 공유`}
        onClick={onShare}
      >
        <svg aria-hidden="true" viewBox="0 0 32 32" focusable="false">
          <path className="share-tray" d="M8.5 15.5v8.25c0 1.52 1.23 2.75 2.75 2.75h9.5c1.52 0 2.75-1.23 2.75-2.75V15.5" />
          <path className="share-arrow" d="M16 21V5.5M10.75 10.75 16 5.5l5.25 5.25" />
        </svg>
      </button>
      {message && <div className="scrap-feedback" role="status">{message}</div>}
    </>
  );
}
