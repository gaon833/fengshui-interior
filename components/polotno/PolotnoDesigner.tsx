"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from "polotno";
import { SidePanel, DEFAULT_SECTIONS } from "polotno/side-panel";
import { Toolbar } from "polotno/toolbar/toolbar";
import { ZoomButtons } from "polotno/toolbar/zoom-buttons";
import { PagesTimeline } from "polotno/pages-timeline";
import { Workspace } from "polotno/canvas/workspace";
import { createStore } from "polotno/model/store";
import { imageFileToDataUrl, type PolotnoDesign } from "@/lib/page-content";
import { showAdminToast } from "@/lib/admin-toast";

type Mode = "desktop" | "mobile";
type Props = {
  desktop: PolotnoDesign;
  mobile: PolotnoDesign;
  onDesktopChange: (design: PolotnoDesign) => void;
  onMobileChange: (design: PolotnoDesign) => void;
  pageLabel: string;
};

const MOBILE_WIDTH = 390;
const MOBILE_HEIGHT = 844;

function buildStore() {
  const key = process.env.NEXT_PUBLIC_POLOTNO_KEY || "";
  return createStore({ key, showCredit: true });
}

function ensurePage(store: any, mode: Mode) {
  if (!store.pages.length) {
    const page = store.addPage();
    if (mode === "mobile") page.set({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });
    else {
      const width = Math.max(900, window.innerWidth - 500);
      const height = Math.max(650, window.innerHeight);
      page.set({ width, height });
    }
  }
}

export default function PolotnoDesigner({ desktop, mobile, onDesktopChange, onMobileChange, pageLabel }: Props) {
  const [mode, setMode] = useState<Mode>("desktop");
  const [ready, setReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const store = useMemo(() => buildStore(), []);
  const currentDesign = mode === "desktop" ? desktop : mobile;

  useEffect(() => {
    const load = async () => {
      try {
        store.clear();
        if (currentDesign && Object.keys(currentDesign).length) await store.loadJSON(currentDesign as any);
        ensurePage(store, mode);
        store.setRole("admin");
        store.toggleRulers(true);
        store.toggleDistanceGuides(true);
        store.history.clear();
        setReady(true);
      } catch (error) {
        console.error(error);
        store.clear();
        ensurePage(store, mode);
        setReady(true);
      }
    };
    setReady(false);
    void load();
  }, [mode]);

  useEffect(() => {
    const dispose = store.on("change", () => {
      const json = store.toJSON() as PolotnoDesign;
      if (mode === "desktop") onDesktopChange(json);
      else onMobileChange(json);
    });
    return () => dispose?.();
  }, [mode, onDesktopChange, onMobileChange, store]);

  const addOptimizedImage = async (file?: File) => {
    if (!file || !store.activePage) return;
    try {
      const src = await imageFileToDataUrl(file);
      const page = store.activePage;
      const maxW = page.computedWidth * 0.55;
      const maxH = page.computedHeight * 0.55;
      page.addElement({ type: "image", src, x: page.computedWidth * 0.08, y: page.computedHeight * 0.08, width: maxW, height: maxH });
      showAdminToast("최적화된 이미지가 캔버스에 추가되었습니다.", "success");
    } catch (error) {
      showAdminToast(error instanceof Error ? error.message : "이미지 처리에 실패했습니다.", "error");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addPage = () => {
    const page = store.addPage();
    const base = store.pages[0];
    page.set({ width: base?.computedWidth || (mode === "mobile" ? MOBILE_WIDTH : 1200), height: base?.computedHeight || (mode === "mobile" ? MOBILE_HEIGHT : 800) });
  };

  const resizeDesktopToWindow = () => {
    if (mode !== "desktop") return;
    const width = Math.max(900, window.innerWidth - 500);
    const height = Math.max(650, window.innerHeight);
    store.pages.forEach((page: any) => page.setSize({ width, height, useMagic: true }));
  };

  const sections = useMemo(() => DEFAULT_SECTIONS.filter((section: any) => section.name !== "upload"), []);

  return <div className="polotno-admin-editor">
    <div className="polotno-admin-bar">
      <strong>{pageLabel} 자유배치 편집기</strong>
      <button type="button" className={mode === "desktop" ? "is-active" : ""} onClick={() => setMode("desktop")}>Desktop 실제 영역</button>
      <button type="button" className={mode === "mobile" ? "is-active" : ""} onClick={() => setMode("mobile")}>Mobile 390px</button>
      <button type="button" onClick={() => fileRef.current?.click()}>+ 고화질 이미지</button>
      <input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => void addOptimizedImage(e.target.files?.[0])} />
      <button type="button" onClick={addPage}>+ 페이지 추가</button>
      {mode === "desktop" ? <button type="button" onClick={resizeDesktopToWindow}>현재 화면 비율로 맞춤</button> : null}
    </div>
    {!process.env.NEXT_PUBLIC_POLOTNO_KEY ? <div className="polotno-key-warning">Polotno API Key가 아직 설정되지 않았습니다. Cloudflare 환경변수에 NEXT_PUBLIC_POLOTNO_KEY를 추가하면 정식 SDK 라이선스가 적용됩니다.</div> : null}
    <div className="polotno-admin-shell">
      {ready ? <PolotnoContainer style={{ width: "100%", height: "100%" }}>
        <SidePanelWrap><SidePanel store={store} sections={sections} defaultSection="text" /></SidePanelWrap>
        <WorkspaceWrap>
          <Toolbar store={store} downloadButtonEnabled={false} />
          <Workspace store={store} layout="vertical" paddingX={36} paddingY={36} pageGap={54} />
          <ZoomButtons store={store} />
          <PagesTimeline store={store} />
        </WorkspaceWrap>
      </PolotnoContainer> : <div className="polotno-loading">편집기를 준비하고 있습니다...</div>}
    </div>
  </div>;
}
