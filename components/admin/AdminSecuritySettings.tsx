"use client";

import { FormEvent, useState } from "react";
import { ADMIN_PASSWORD_HASH_KEY, clearFailures, ensurePasswordHash, hashPassword, logoutAdmin } from "@/lib/admin-auth";

export default function AdminSecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (newPassword.length < 6) {
      setMessage("새 비밀번호는 6자 이상으로 입력하세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    const saved = await ensurePasswordHash();
    if ((await hashPassword(currentPassword)) !== saved) {
      setMessage("현재 비밀번호가 맞지 않습니다.");
      return;
    }
    localStorage.setItem(ADMIN_PASSWORD_HASH_KEY, await hashPassword(newPassword));
    clearFailures();
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("비밀번호가 변경되었습니다.");
  }

  return (
    <section className="admin-security-panel">
      <h2>관리자 보안</h2>
      <form onSubmit={submit}>
        <label><span>현재 비밀번호</span><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></label>
        <label><span>새 비밀번호</span><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required /></label>
        <label><span>새 비밀번호 확인</span><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required /></label>
        <div className="admin-security-actions">
          <button type="submit">비밀번호 변경</button>
          <button type="button" className="secondary" onClick={logoutAdmin}>로그아웃</button>
        </div>
        {message && <p className="admin-security-message" role="status">{message}</p>}
      </form>
    </section>
  );
}
