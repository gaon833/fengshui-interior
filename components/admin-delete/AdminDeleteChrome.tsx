"use client";

import type { CSSProperties } from "react";
import { leaveAdminDeleteMode } from "@/lib/admin-delete-mode";
import styles from "./AdminDeleteChrome.module.css";

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
  border: "1px solid rgba(255,255,255,.94)",
  borderRadius: 12,
  background: "rgba(255,255,255,.9)",
  color: "#333",
  boxShadow: "0 8px 24px rgba(0,0,0,.12)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  fontFamily: "Arial, sans-serif",
  fontSize: 25,
  fontWeight: 300,
  lineHeight: 1,
  cursor: "pointer",
};

function DoneIcon() {
  return (
    <svg className={styles.doneIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12.5 4.2 4.2L19 7" />
    </svg>
  );
}

export function AdminDeleteChrome({ label = "이미지 삭제" }: { label?: string }) {
  const title = label.includes("PROJECT")
    ? "PROJECTS 이미지 삭제"
    : label.includes("GALLERY")
      ? "GALLERY 이미지 삭제"
      : label;

  const description = title.startsWith("PROJECTS")
    ? "프로젝트에서 삭제할 이미지를 선택한 후 완료를 눌러주세요."
    : "홈페이지에서 삭제할 이미지를 선택한 후 완료를 눌러주세요.";

  return (
    <header className={styles.header} aria-label={title}>
      <div className={styles.copy}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      <button className={styles.done} type="button" onClick={leaveAdminDeleteMode}>
        <DoneIcon />
        <span>완료</span>
      </button>
    </header>
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
