"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  ADMIN_AUTH_EVENT,
  LOCK_DURATION_MS,
  MAX_FAILURES,
  clearFailures,
  createSession,
  ensurePasswordHash,
  getFailureState,
  hasValidSession,
  hashPassword,
  saveFailureState,
} from "@/lib/admin-auth";

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);

  useEffect(() => {
    void ensurePasswordHash().then(() => {
      setAuthenticated(hasValidSession());
      setLockedUntil(getFailureState().lockedUntil);
      setReady(true);
    });
    const sync = () => setAuthenticated(hasValidSession());
    window.addEventListener(ADMIN_AUTH_EVENT, sync);
    return () => window.removeEventListener(ADMIN_AUTH_EVENT, sync);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const now = Date.now();
    const failure = getFailureState();
    if (failure.lockedUntil > now) {
      const minutes = Math.max(1, Math.ceil((failure.lockedUntil - now) / 60000));
      setLockedUntil(failure.lockedUntil);
      setMessage(`로그인이 잠겨 있습니다. 약 ${minutes}분 후 다시 시도하세요.`);
      return;
    }

    const savedHash = await ensurePasswordHash();
    const enteredHash = await hashPassword(password);
    if (savedHash === enteredHash) {
      clearFailures();
      createSession(remember);
      setAuthenticated(true);
      setPassword("");
      setMessage("");
      return;
    }

    const count = failure.count + 1;
    if (count >= MAX_FAILURES) {
      const until = now + LOCK_DURATION_MS;
      saveFailureState({ count: 0, lockedUntil: until });
      setLockedUntil(until);
      setMessage("비밀번호를 5회 틀려 5분 동안 로그인이 잠겼습니다.");
    } else {
      saveFailureState({ count, lockedUntil: 0 });
      setMessage(`비밀번호가 맞지 않습니다. ${MAX_FAILURES - count}회 더 시도할 수 있습니다.`);
    }
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
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            disabled={currentlyLocked}
            required
          />
        </label>
        <label className="admin-login-remember">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          <span>로그인 상태 7일 유지</span>
        </label>
        {message && <p className="admin-login-message" role="alert">{message}</p>}
        <button type="submit" disabled={currentlyLocked}>로그인</button>
        <p className="admin-login-help">최초 비밀번호: <strong>fengshui2026</strong></p>
      </form>
    </main>
  );
}
