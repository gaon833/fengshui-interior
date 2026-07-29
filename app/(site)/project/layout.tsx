import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "PROJECTS",
  description: "평형별로 살펴보는 풍수 인테리어 아파트 및 상업공간 포트폴리오입니다.",
  alternates: { canonical: "/project/" },
};

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return children;
}
