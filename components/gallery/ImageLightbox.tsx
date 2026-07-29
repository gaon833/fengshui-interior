"use client";

import Image from "next/image";
import { useEffect } from "react";
import ScrapButton from "@/components/project/ScrapButton";
import ShareIconButton from "@/components/project/ShareIconButton";

type LightboxItem = {
  id: string;
  src: string;
  alt: string;
  projectSlug?: string;
  projectTitle: string;
};

type Props = {
  item: LightboxItem | null;
  onClose: () => void;
};

export default function ImageLightbox({ item, onClose }: Props) {
  useEffect(() => {
    if (!item) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`${item.alt} 확대 보기`} onMouseDown={onClose}>
      <div className="image-lightbox-panel" onMouseDown={(event) => event.stopPropagation()}>
        <div className="image-lightbox-media">
          <Image
            src={item.src}
            alt={item.alt}
            width={1800}
            height={2400}
            sizes="95vw"
            priority
            unoptimized={item.src.startsWith("data:")}
          />
          <ScrapButton
            className="image-lightbox-heart"
            item={{
              id: item.id,
              kind: "image",
              projectSlug: item.projectSlug || "gallery",
              projectTitle: item.projectTitle,
              src: item.src,
              alt: item.alt,
            }}
          />
          <ShareIconButton
            className="image-lightbox-share"
            projectSlug={item.projectSlug}
            projectTitle={item.projectTitle}
            fallbackPath="/gallery"
          />
          <button type="button" className="image-lightbox-close" aria-label="확대 이미지 닫기" onClick={onClose}>×</button>
        </div>
      </div>
    </div>
  );
}
