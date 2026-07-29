import ShareProjectButton from "./ShareProjectButton";
export default function ProjectEngagementActions({slug,title}:{slug:string;title:string}){
 return <div className="project-engagement-actions"><ShareProjectButton slug={slug} title={title}/></div>;
}
