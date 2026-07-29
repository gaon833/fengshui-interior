"use client";

import { useEffect, useState } from "react";

export const ADMIN_DELETE_PARAM = "adminDelete";

export function useAdminDeleteMode() {
  const [requested, setRequested] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wantsDeleteMode = params.get(ADMIN_DELETE_PARAM) === "1";
    setRequested(wantsDeleteMode);
    if (!wantsDeleteMode) {
      setChecking(false);
      return;
    }
    void fetch("/api/admin/session", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        const payload = await response.json() as { authenticated?: boolean };
        if (!response.ok || !payload.authenticated) {
          window.location.href = "/admin";
          return;
        }
        setAuthorized(true);
      })
      .catch(() => { window.location.href = "/admin"; })
      .finally(() => setChecking(false));
  }, []);

  return { requested, authorized, checking, active: requested && authorized };
}

export function leaveAdminDeleteMode() {
  const url = new URL(window.location.href);
  url.searchParams.delete(ADMIN_DELETE_PARAM);
  window.location.href = `${url.pathname}${url.search}${url.hash}`;
}
