import Image from "next/image";
import type { ProjectImage } from "@/types/project";
export default function ProjectGallery({images}:{images:ProjectImage[]}){
 return <>{images.map((image,index)=><figure className={`detail-photo ${image.orientation === "portrait" ? "portrait" : "landscape"}`} key={`${image.src}-${index}`}><Image src={image.src} alt={image.alt} width={image.orientation === "portrait" ? 900 : 1600} height={image.orientation === "portrait" ? 1300 : 1050} loading="lazy" decoding="async" quality={80} sizes="(max-width:900px) calc(100vw - 36px), 70vw"/></figure>)}</>;
}
