import Image from "next/image";
import type { ProjectImage } from "@/types/project";

export default function ProjectGallery({ images }: { images: ProjectImage[] }) {
  return (
    <section className="project-gallery">
      {images.map((image, index) => (
        <figure key={`${image.src}-${index}`}>
          <Image
            src={image.src}
            alt={image.alt}
            width={1600}
            height={1100}
            sizes="(max-width: 900px) 100vw, 70vw"
          />
        </figure>
      ))}
    </section>
  );
}
