import Image from "next/image";
import site from "@/content/site.json";

export default function HomePage() {
  return (
    <section className="home-main" aria-label="풍수 인테리어 대표 프로젝트">
      <div className="home-main__frame">
        <Image
          className="home-main__image"
          src={site.mainImage}
          alt="풍수 인테리어 대표 프로젝트"
          width={1196}
          height={668}
          priority
          sizes="(max-width: 900px) calc(100vw - 36px), calc(100vw - 900px)"
        />
      </div>
    </section>
  );
}
