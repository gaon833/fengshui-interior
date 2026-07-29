import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CONSULTATION",
  description: "풍수 인테리어 상담 신청과 연락 방법을 안내합니다.",
  alternates: { canonical: "/reservation/" },
};

export default function ReservationLayout({ children }: { children: ReactNode }) {
  return children;
}
