import type { Metadata } from "next";
import ScrapBoard from "@/components/scrap/ScrapBoard";
export const metadata: Metadata={title:"SCRAP",description:"마음에 드는 프로젝트와 공간 이미지를 모아보세요."};
export default function ScrapPage(){return <div className="scrap-page"><header><h1>SCRAP</h1><p>마음에 든 집과 공간을 한곳에 모았습니다.</p></header><ScrapBoard/></div>}
