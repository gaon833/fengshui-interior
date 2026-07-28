import Image from "next/image";
import site from "@/content/site.json";

export default function HomePage() {
  return (
    <section className="home-main" aria-label="풍수 인테리어 대표 프로젝트">
      <div className="home-main__frame">
        <Image
          className="home-main__image home-main__image--desktop"
          src={site.mainImage}
          alt="풍수 인테리어 대표 프로젝트"
          width={1196}
          height={668}
          priority
          sizes="calc(100vw - 800px)"
        />
        <Image
          className="home-main__image home-main__image--mobile"
          src={site.mobileMainImage || site.mainImage}
          alt="풍수 인테리어 모바일 대표 프로젝트"
          width={900}
          height={1300}
          priority
          sizes="calc(100vw - 36px)"
        />
      </div>
    </section>
  );
}
