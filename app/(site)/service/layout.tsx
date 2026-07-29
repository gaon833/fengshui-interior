import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "PROCESS",
  description: "풍수 인테리어의 상담부터 설계와 시공까지 진행 절차를 안내합니다.",
  alternates: { canonical: "/service/" },
};

export default function ServiceLayout({ children }: { children: ReactNode }) {
  return children;
}
