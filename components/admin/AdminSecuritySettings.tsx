"use client";

import { FormEvent, useState } from "react";
import { changeAdminPassword, logoutAdmin } from "@/lib/admin-auth";
import { showAdminToast } from "@/lib/admin-toast";

export default function AdminSecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{4}$/.test(newPassword)) {
      setMessage("새 비밀번호는 숫자 4자리로 입력하세요.");
      showAdminToast("새 비밀번호는 숫자 4자리로 입력하세요.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("새 비밀번호 확인이 일치하지 않습니다.");
      showAdminToast("새 비밀번호 확인이 일치하지 않습니다.", "error");
      return;
    }
    setSaving(true);
    const result = await changeAdminPassword(currentPassword, newPassword);
    setSaving(false);
    const nextMessage = result.message || (result.ok ? "비밀번호가 변경되었습니다." : "비밀번호 변경에 실패했습니다.");
    setMessage(nextMessage);
    showAdminToast(nextMessage, result.ok ? "success" : "error");
    if (result.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await logoutAdmin();
    }
  }

  return (
    <section className="admin-security-panel">
      <h2>관리자 보안</h2>
      <form onSubmit={submit}>
        <label><span>현재 비밀번호</span><input type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value.replace(/\D/g, "").slice(0, 4))} autoComplete="current-password" required /></label>
        <label><span>새 비밀번호</span><input type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} value={newPassword} onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, "").slice(0, 4))} autoComplete="new-password" required /></label>
        <label><span>새 비밀번호 확인</span><input type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, "").slice(0, 4))} autoComplete="new-password" required /></label>
        <div className="admin-security-actions">
          <button type="submit" disabled={saving}>{saving ? "변경 중" : "비밀번호 변경"}</button>
          <button type="button" className="secondary" onClick={() => void logoutAdmin()}>로그아웃</button>
        </div>
        {message && <p className="admin-security-message" role="status">{message}</p>}
      </form>
    </section>
  );
}
