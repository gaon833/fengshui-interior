"use client";

import Link from "next/link";
import { useState } from "react";

export default function MenuOverlay() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={`menuButton ${open ? "isOpen" : ""}`} aria-label={open ? "메뉴 닫기" : "메뉴 열기"} onClick={() => setOpen(!open)}>
        <span /><span />
      </button>
      <button className={`pageDim ${open ? "isVisible" : ""}`} aria-label="메뉴 닫기" onClick={() => setOpen(false)} />
      <aside className={`menuPanel ${open ? "isOpen" : ""}`}>
        <Link className="menuBrand" href="/" onClick={() => setOpen(false)}>풍수 인테리어</Link>
        <nav>
          <Link href="/about/" onClick={() => setOpen(false)}>about us</Link>
          <Link href="/contact/" onClick={() => setOpen(false)}>contact us</Link>
          <Link href="/work/" onClick={() => setOpen(false)}>work</Link>
        </nav>
      </aside>
    </>
  );
}
