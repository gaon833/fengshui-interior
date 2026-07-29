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
          <path d="M10.8 16.2 22.3 9.6M10.8 16.2l11.5 6.6" />
          <circle cx="8" cy="16" r="4.2" />
          <circle cx="24.5" cy="7.8" r="4.2" />
          <circle cx="24.5" cy="24.2" r="4.2" />
        </svg>
      </button>
      {message && <div className="scrap-feedback" role="status">{message}</div>}
    </>
  );
}
