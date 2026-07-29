import type { Metadata } from "next";

export const metadata: Metadata = { title: "OUR STORY", description: "풍수 인테리어의 브랜드 이야기와 공간 철학을 소개합니다." };

export default function Page() {
  return (
    <section className="simple-page">
      <h1>OUR STORY</h1>
      <p>우리가 어떤 회사인지, 브랜드 철학과 풍수 인테리어의 이야기를 소개합니다.</p>
    </section>
  );
}
