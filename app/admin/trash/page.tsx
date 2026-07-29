import projects from "@/content/projects.json";
import TrashManager from "@/components/admin/TrashManager";
export default function TrashPage(){return <TrashManager projects={projects as any}/>;}
