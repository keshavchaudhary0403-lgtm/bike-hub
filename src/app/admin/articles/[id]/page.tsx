import Link from "next/link";import {notFound} from "next/navigation";import {ArrowLeft} from "lucide-react";import {DashShell,Flash,Pill} from "@/components/dashboard";import {ArticleForm,type PostRow} from "@/components/content-forms";import {requireStaff} from "@/lib/admin";
export const metadata={title:"Edit article · Admin"};
export default async function EditArticle({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{saved?:string;error?:string}>}){const {supabase}=await requireStaff();const [{id},sp]=await Promise.all([params,searchParams]);
if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
const {data}=await supabase.from("posts").select("*").eq("id",id).maybeSingle();if(!data)notFound();const p=data as PostRow;
return <DashShell area="admin" active="articles" title={p.title} actions={<><Pill value={p.status==="published"?"live":"hidden"} label={p.status==="published"?"Published":"Draft"}/><Link className="button secondary small" href="/admin/articles"><ArrowLeft/> All articles</Link></>}>
<Flash saved={sp.saved} error={sp.error}/><ArticleForm post={p}/></DashShell>}
