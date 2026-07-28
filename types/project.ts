export type ProjectCategory = "20" | "30" | "40" | "50" | "60" | "C";
export type ProjectStatus = "draft" | "published" | "private" | "trash";
export type ProjectCardLayout = "wide" | "portrait" | "square";

export type ProjectImage = {
  id: string;
  src: string;
  alt: string;
  order: number;
  isCover?: boolean;
  orientation?: "landscape" | "portrait";
};

export type ProjectSeo = {
  title: string;
  description: string;
  ogImage?: string;
};

export type ProjectRevision = {
  id: string;
  createdAt: string;
  note: string;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  category: ProjectCategory;
  useType: string;
  location: string;
  area: string;
  year: number;
  tags: string[];
  coverImage: string;
  coverOrientation?: "landscape" | "portrait";
  images: ProjectImage[];
  order: number;
  status: ProjectStatus;
  featured: boolean;
  cardLayout?: ProjectCardLayout;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  seo: ProjectSeo;
  revisions: ProjectRevision[];
};
