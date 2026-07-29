import Link from "next/link";
import ProcessSettingsForm from "@/components/admin/ProcessSettingsForm";
export default function AdminServicePage(){return <><div className="admin-heading"><div><h1>PROCESS 관리</h1></div><Link className="admin-filter-button" href="/service/?adminDelete=1">홈페이지에서 이미지 삭제</Link></div><ProcessSettingsForm/></>;}
