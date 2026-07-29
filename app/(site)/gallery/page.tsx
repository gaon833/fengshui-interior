import type { Metadata } from "next";
import GalleryBoard from "@/components/gallery/GalleryBoard";

export const metadata: Metadata = {
  title: "GALLERY",
  description: "거실, 주방, 욕실과 인테리어 디테일을 한눈에 둘러보세요.",
};

export default function GalleryPage() {
  return <main className="gallery-page"><GalleryBoard /></main>;
}
