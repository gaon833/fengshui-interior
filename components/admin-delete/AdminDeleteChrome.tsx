"use client";

import { leaveAdminDeleteMode } from "@/lib/admin-delete-mode";

export function AdminDeleteChrome({ label = "이미지 삭제 모드" }: { label?: string }) {
  return <div className="admin-delete-chrome" role="status">
    <span>{label}</span>
    <button type="button" onClick={leaveAdminDeleteMode}>완료</button>
  </div>;
}

export function AdminDeleteButton({ onDelete, label = "삭제" }: { onDelete: () => void; label?: string }) {
  return <button type="button" className="admin-delete-x" aria-label={label} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDelete(); }}>×</button>;
}

export function confirmVisualDelete(title: string, description = "삭제하면 복구할 수 없습니다.") {
  return window.confirm(`${title}\n\n${description}`);
}
