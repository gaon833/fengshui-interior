import type { Metadata } from "next";

export const metadata: Metadata = { title: "CONSULTATION", description: "풍수 인테리어 방문 상담을 신청하고 안내를 확인하세요." };

export default function Page() {
  return (
    <section className="simple-page">
      <h1>CONSULTATION</h1>
      <p>방문 상담 안내와 상담 신청, 연락처와 위치 정보를 확인할 수 있습니다.</p>
    </section>
  );
}
