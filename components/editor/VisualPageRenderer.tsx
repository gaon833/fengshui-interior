import type { CSSProperties } from "react";
import type { EditorMode, VisualDocument, VisualElement, VisualPage } from "@/lib/visual-editor";

function elementStyle(el: VisualElement, page: VisualPage, mode: EditorMode): CSSProperties {
  const l = el.layouts[mode]; const size = page[mode];
  return {
    position: "absolute", left: `${(l.x/size.width)*100}%`, top: `${(l.y/size.height)*100}%`,
    width: `${(l.width/size.width)*100}%`, height: `${(l.height/size.height)*100}%`,
    transform: `rotate(${l.rotate}deg)`, zIndex: l.z, opacity: el.opacity ?? 1,
  };
}
function Element({el,page,mode}:{el:VisualElement;page:VisualPage;mode:EditorMode}) {
  const size=page[mode];
  if(el.type==="image") return <div style={elementStyle(el,page,mode)}><img src={el.src||""} alt="" loading="lazy" decoding="async" style={{width:"100%",height:"100%",objectFit:el.objectFit||"cover",display:"block"}}/></div>;
  if(el.type==="text") return <div style={{...elementStyle(el,page,mode),fontSize:`${((el.fontSize||32)/size.width)*100}cqw`,fontWeight:el.fontWeight||400,color:el.color||"#2f2a26",textAlign:el.textAlign||"left",lineHeight:el.lineHeight||1.45,whiteSpace:"pre-wrap",overflow:"hidden"}}>{el.text}</div>;
  if(el.type==="rect") return <div style={{...elementStyle(el,page,mode),background:el.background||"transparent",border:`${el.borderWidth||1}px solid ${el.borderColor||"#777"}`,borderRadius:el.radius||0,boxSizing:"border-box"}}/>;
  const vertical=el.lineOrientation==="vertical";
  return <div style={{...elementStyle(el,page,mode),display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{display:"block",background:el.color||"#777",width:vertical?`${el.borderWidth||1}px`:"100%",height:vertical?"100%":`${el.borderWidth||1}px`}}/></div>;
}
export default function VisualPageRenderer({document,label}:{document:VisualDocument;label:string}){
  if(!document?.pages?.length)return null;
  return <section className="visual-public-document" aria-label={label}>{document.pages.map((page)=><section key={page.id} className="visual-public-page" style={{["--desktop-ratio" as string]:`${page.desktop.width}/${page.desktop.height}`,["--mobile-ratio" as string]:`${page.mobile.width}/${page.mobile.height}`} as CSSProperties}>
    <div className="visual-desktop-layer">{page.elements.map(el=><Element key={el.id} el={el} page={page} mode="desktop"/>)}</div>
    <div className="visual-mobile-layer">{page.elements.map(el=><Element key={el.id} el={el} page={page} mode="mobile"/>)}</div>
  </section>)}</section>;
}
