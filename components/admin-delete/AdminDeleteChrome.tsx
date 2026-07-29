"use client";

import type { CSSProperties } from "react";
import { leaveAdminDeleteMode } from "@/lib/admin-delete-mode";

const deleteButtonStyle: CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  left: "auto",
  bottom: "auto",
  zIndex: 80,
  width: 38,
  height: 38,
  display: "grid",
  placeItems: "center",
  margin: 0,
  padding: 0,
  border: "1px solid rgba(255,255,255,.92)",
  borderRadius: 12,
  background: "rgba(255,255,255,.28)",
  color: "#fff",
  boxShadow: "0 8px 24px rgba(0,0,0,.18)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  textShadow: "0 1px 5px rgba(0,0,0,.42)",
  fontFamily: "Arial, sans-serif",
  fontSize: 26,
  fontWeight: 300,
  lineHeight: 1,
  cursor: "pointer",
};

export function AdminDeleteChrome({ label = "이미지 삭제" }: { label?: string }) {
  return (
    <div className="admin-delete-chrome" role="status" aria-label={label}>
      <button className="admin-delete-chrome__done" type="button" onClick={leaveAdminDeleteMode}>완료</button>
    </div>
  );
}

export function AdminDeleteButton({ onDelete, label = "삭제" }: { onDelete: () => void; label?: string }) {
  return (
    <button
      type="button"
      className="admin-delete-x"
      style={deleteButtonStyle}
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDelete();
      }}
    >
      ×
    </button>
  );
}

export function confirmVisualDelete(title: string, description = "삭제하면 복구할 수 없습니다.") {
  return window.confirm(`${title}\n\n${description}`);
}
