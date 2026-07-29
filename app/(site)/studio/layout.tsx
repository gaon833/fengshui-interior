import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "OUR STORY",
  description: "풍수 인테리어의 공간 철학과 디자인 이야기를 소개합니다.",
  alternates: { canonical: "/studio/" },
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return children;
}
