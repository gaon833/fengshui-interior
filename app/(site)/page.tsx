import Image from "next/image";
import site from "@/content/site.json";

export default function HomePage() {
  return (
    <section className="home-hero">
      <Image
        src={site.mainImage}
        alt="풍수 인테리어 대표 프로젝트"
        fill
        priority
        sizes="(max-width: 900px) 100vw, calc(100vw - 400px)"
      />
    </section>
  );
}
