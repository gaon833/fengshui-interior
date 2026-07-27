import type { Metadata } from "next"; import "@/styles/tokens.css"; import "@/styles/global.css";
export const metadata:Metadata={title:"풍수 인테리어",description:"풍수 인테리어 포트폴리오"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
