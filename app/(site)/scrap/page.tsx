import type { Metadata } from "next";
import ScrapBoard from "@/components/scrap/ScrapBoard";

export const metadata: Metadata = {
  title: "SCRAP",
  description: "마음에 드는 프로젝트와 공간 이미지를 모아보세요.",
};

export default function ScrapPage() {
  return <main className="scrap-page"><ScrapBoard /></main>;
}
