import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const projectsPath = path.join(root, "content", "projects.json");
const sitePath = path.join(root, "content", "site.json");
const projects = JSON.parse(fs.readFileSync(projectsPath, "utf8"));
const site = JSON.parse(fs.readFileSync(sitePath, "utf8"));

const errors = [];
const warnings = [];
const categories = new Set(["20", "30", "40", "50", "60", "C"]);
const statuses = new Set(["draft", "published", "private", "trash"]);

function duplicateValues(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

function checkPublicAsset(assetPath, label) {
  if (!assetPath || typeof assetPath !== "string") {
    errors.push(`${label}: 경로가 없습니다.`);
    return;
  }
  if (!assetPath.startsWith("/")) {
    errors.push(`${label}: public 경로는 /로 시작해야 합니다: ${assetPath}`);
    return;
  }
  const filePath = path.join(root, "public", assetPath.slice(1));
  if (!fs.existsSync(filePath)) errors.push(`${label}: 파일이 없습니다: ${assetPath}`);
}

if (!Array.isArray(projects)) errors.push("projects.json 최상위 값은 배열이어야 합니다.");

for (const field of ["id", "slug"]) {
  const duplicates = duplicateValues(projects.map((project) => project[field]));
  if (duplicates.length) errors.push(`중복 ${field}: ${duplicates.join(", ")}`);
}

for (const project of projects) {
  const prefix = `프로젝트 ${project.slug ?? project.id ?? "unknown"}`;
  if (!project.id || !project.slug || !project.title) errors.push(`${prefix}: id, slug, title은 필수입니다.`);
  if (!categories.has(project.category)) errors.push(`${prefix}: 지원하지 않는 category ${project.category}`);
  if (!statuses.has(project.status)) errors.push(`${prefix}: 지원하지 않는 status ${project.status}`);
  if (!Number.isFinite(project.order)) errors.push(`${prefix}: order는 숫자여야 합니다.`);
  checkPublicAsset(project.coverImage, `${prefix} 대표 이미지`);

  if (!Array.isArray(project.images)) {
    errors.push(`${prefix}: images는 배열이어야 합니다.`);
    continue;
  }

  const imageIds = duplicateValues(project.images.map((image) => image.id));
  if (imageIds.length) errors.push(`${prefix}: 중복 이미지 id ${imageIds.join(", ")}`);

  const imageOrders = duplicateValues(project.images.map((image) => image.order));
  if (imageOrders.length) errors.push(`${prefix}: 중복 이미지 order ${imageOrders.join(", ")}`);

  for (const image of project.images) {
    if (!Number.isFinite(image.order)) errors.push(`${prefix}/${image.id}: order는 숫자여야 합니다.`);
    checkPublicAsset(image.src, `${prefix}/${image.id}`);
  }
}

checkPublicAsset(site.logo, "사이트 로고");
checkPublicAsset(site.mainImage, "메인 이미지");
checkPublicAsset(site.seo?.ogImage, "사이트 OG 이미지");

for (const [label, url] of [["blogUrl", site.blogUrl], ["instagramUrl", site.instagramUrl], ["kakaoUrl", site.contact?.kakaoUrl], ["naverTalkUrl", site.contact?.naverTalkUrl]]) {
  if (!url || url === "#") warnings.push(`${label}: 실제 운영 URL이 아직 설정되지 않았습니다.`);
}

if (warnings.length) {
  console.warn("\n[경고]");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error("\n[검증 실패]");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`\n검증 통과: 프로젝트 ${projects.length}개, 이미지 ${projects.reduce((sum, project) => sum + project.images.length, 0)}개`);
