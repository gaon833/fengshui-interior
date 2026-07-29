"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  src: string;
  alt: string;
  kindLabel: string;
  onClose: () => void;
  onDelete: () => void;
};

export default function AdminDeleteLightbox({ open, src, alt, kindLabel, onClose, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) { setConfirming(false); return; }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") confirming ? setConfirming(false) : onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [open, confirming, onClose]);

  if (!open) return null;

  return (
    <div className="admin-media-lightbox" role="dialog" aria-modal="true" aria-label={`${kindLabel} 삭제 관리`} onMouseDown={(event) => { if (event.target === event.currentTarget && !confirming) onClose(); }}>
      <div className="admin-media-lightbox-blur" />
      <div className="admin-media-lightbox-stage">
        <Image src={src} alt={alt} width={1800} height={1800} sizes="92vw" unoptimized={src.startsWith("data:")} />
        <button type="button" className="admin-media-delete-x" aria-label={`${kindLabel} 삭제`} onClick={() => setConfirming(true)}>×</button>
      </div>

      {confirming && (
        <div className="admin-delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="admin-delete-title">
          <div className="admin-delete-confirm-card">
            <h2 id="admin-delete-title">{kindLabel}을 삭제하시겠습니까?</h2>
            <p>삭제하면 공개 화면에서 즉시 사라지며 복구할 수 없습니다.</p>
            <div>
              <button type="button" className="admin-delete-cancel" onClick={() => setConfirming(false)}>취소</button>
              <button type="button" className="admin-delete-ok" onClick={() => { onDelete(); setConfirming(false); onClose(); }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
