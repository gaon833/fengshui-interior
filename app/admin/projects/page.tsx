import Link from "next/link";
import AdminProjectList from "@/components/admin/AdminProjectList";
import { getAdminProjects } from "@/lib/projects";
import styles from "@/components/admin/ProjectsV7.module.css";

function TrashIcon(){return <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/></svg>}
export default function AdminProjectsPage() { return <div className={styles.page}><div className={styles.header}><div><h1 className={styles.title}>PROJECTS 관리</h1><p className={styles.subtitle}>공개·작성 중·비공개·휴지통 프로젝트를 한 목록에서 조회합니다.</p></div><div className={styles.headerActions}><Link className={styles.button} href="/project/?adminDelete=1&returnTo=%2Fadmin%2Fprojects"><TrashIcon/>이미지 삭제</Link><Link className={styles.primaryButton} href="/admin/projects/new">＋ 새 프로젝트</Link></div></div><AdminProjectList projects={getAdminProjects()} /></div>; }
