"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { ADMIN_AUTH_EVENT, checkAdminSession, loginAdmin } from "@/lib/admin-auth";

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sync = async () => {
      setAuthenticated(await checkAdminSession());
      setReady(true);
    };
    void sync();
    window.addEventListener(ADMIN_AUTH_EVENT, sync);
    return () => window.removeEventListener(ADMIN_AUTH_EVENT, sync);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || lockedUntil > Date.now()) return;
    setSubmitting(true);
    setMessage("");
    const result = await loginAdmin(password, remember);
    setSubmitting(false);

    if (result.ok) {
      setAuthenticated(true);
      setPassword("");
      return;
    }

    if (result.lockedUntil) setLockedUntil(result.lockedUntil);
    setMessage(result.message || "로그인에 실패했습니다.");
  }

  if (!ready) return <div className="admin-auth-loading">관리자 인증을 확인하고 있습니다.</div>;
  if (authenticated) return <>{children}</>;

  const currentlyLocked = lockedUntil > Date.now();
  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <p className="admin-login-brand">풍수 인테리어</p>
        <h1>관리자 로그인</h1>
        <label>
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value.replace(/\D/g, "").slice(0, 4))}
            autoComplete="current-password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            minLength={4}
            maxLength={4}
            autoFocus
            disabled={currentlyLocked || submitting}
            required
          />
        </label>
        <label className="admin-login-remember">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          <span>로그인 상태 7일 유지</span>
        </label>
        {message && <p className="admin-login-message" role="alert">{message}</p>}
        <button type="submit" disabled={currentlyLocked || submitting}>{submitting ? "확인 중" : "로그인"}</button>
      </form>
    </main>
  );
}
