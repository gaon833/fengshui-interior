export const GALLERY_TAG_OPTIONS = {
  spaces: ["거실", "주방", "욕실", "침실", "다이닝", "현관", "복도", "드레스룸", "서재", "세탁실", "베란다", "외관", "기타"],
  structures: ["오픈형", "대면형", "독립형", "일자형", "ㄱ자형", "ㄷ자형", "아일랜드형", "거실+주방", "주방+다이닝", "거실+다이닝"],
  styles: ["모던", "미니멀", "내추럴", "컨템포러리", "클래식", "빈티지", "북유럽", "호텔식", "웜 미니멀", "소프트 미니멀", "재팬디", "와비사비", "콰이어트 럭셔리", "럭셔리 모던", "어반 모던"],
  colors: ["화이트", "아이보리", "크림", "베이지", "샌드", "그레이", "차콜", "블랙", "브라운", "우드톤", "올리브", "세이지그린"],
  materials: ["원목", "오크", "월넛", "대리석", "포세린", "타일", "유리", "금속", "스테인리스", "템바보드", "패브릭", "리넨"],
  features: ["간접조명", "라인조명", "매립조명", "펜던트조명", "무몰딩", "히든도어", "아치형", "곡선 디자인", "아일랜드", "대형창", "오픈선반", "붙박이장", "수납특화", "플로팅가구"],
} as const;

export type GalleryTagCategory = keyof typeof GALLERY_TAG_OPTIONS;

export type GalleryTags = {
  space: string;
  structures: string[];
  styles: string[];
  colors: string[];
  materials: string[];
  features: string[];
};

export const EMPTY_GALLERY_TAGS: GalleryTags = {
  space: "",
  structures: [],
  styles: [],
  colors: [],
  materials: [],
  features: [],
};

export function galleryTagsToSearchText(tags: GalleryTags): string {
  return [tags.space, ...tags.structures, ...tags.styles, ...tags.colors, ...tags.materials, ...tags.features].filter(Boolean).join(" ");
}
