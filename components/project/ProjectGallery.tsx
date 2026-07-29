import Image from "next/image";
import type { ProjectImage } from "@/types/project";
import ScrapButton from "./ScrapButton";
import ShareIconButton from "./ShareIconButton";
export default function ProjectGallery({images,projectSlug,projectTitle}:{images:ProjectImage[];projectSlug:string;projectTitle:string}){
 return <>{images.map((image,index)=><figure className={`detail-photo ${image.orientation === "portrait" ? "portrait" : "landscape"}`} key={`${image.src}-${index}`}>
  <div className="detail-photo-inner">
   <Image src={image.src} alt={image.alt || `프로젝트 상세 이미지 ${index + 1}`} width={image.orientation === "portrait" ? 900 : 1600} height={image.orientation === "portrait" ? 1300 : 1050} loading="lazy" fetchPriority="low" decoding="async" quality={80} unoptimized={image.src.startsWith("data:")} sizes="(max-width:900px) calc(100vw - 36px), 70vw"/>
   <ScrapButton className="detail-image-heart" item={{id:`image:${projectSlug}:${image.id || index}`,kind:"image",projectSlug,projectTitle,src:image.src,alt:image.alt || `${projectTitle} 상세 이미지 ${index+1}`}} />
   <ShareIconButton className="detail-image-share" projectSlug={projectSlug} projectTitle={projectTitle} />
  </div>
 </figure>)}</>;
}
