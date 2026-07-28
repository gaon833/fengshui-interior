import site from "@/content/site.json";

export default function HomePage() {
  return (
    <section className="home-hero">
      <img
        className="home-hero-image"
        src={site.mainImage}
        alt="풍수 인테리어 대표 프로젝트"
      />
    </section>
  );
}
