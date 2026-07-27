import siteJson from "./site.json";
import aboutJson from "./about.json";
import contactJson from "./contact.json";
import projectsJson from "./projects.json";
export type Orientation = "landscape" | "portrait";
export interface GalleryImage { image: string; orientation: Orientation; }
export interface Project { title:string; slug:string; category:"Residential"|"Commercial"|"Office"; location?:string; area?:string; housingType?:string; family?:string; year?:string; cover:string; order:number; gallery:GalleryImage[]; }
export const site=siteJson; export const about=aboutJson; export const contact=contactJson;
export const projects=(projectsJson.projects as Project[]).slice().sort((a,b)=>a.order-b.order);
export const getProject=(slug:string)=>projects.find(p=>p.slug===slug);
