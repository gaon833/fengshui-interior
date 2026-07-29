import Link from "next/link";
import StorySettingsForm from "@/components/admin/StorySettingsForm";
export default function AdminStudioPage(){return <><div className="admin-heading"><div><h1>OUR STORY 관리</h1></div><Link className="admin-filter-button" href="/studio/?adminDelete=1">홈페이지에서 이미지 삭제</Link></div><StorySettingsForm/></>;}
