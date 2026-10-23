import Link from "next/link";import {ExternalLink,Pencil,Plus} from "lucide-react";import {DashShell,Pill} from "@/components/dashboard";import {formatDate,requireStaff} from "@/lib/admin";
export const metadata={title:"Articles · Admin"};
const TABS=[["","All"],["published","Published"],["draft","Drafts"]] as const;
export default async function AdminArticles({searchParams}:{searchParams:Promise<{status?:string}>}){const {supabase}=await requireStaff();const {status}=await searchParams;
let q=supabase.from("posts").select("id,slug,title,category,author_name,status,is_expert_content,published_at,created_at").order("created_at",{ascending:false}).limit(300);
if(status==="published"||status==="draft")q=q.eq("status",status);const {data}=await q;
return <DashShell area="admin" active="articles" title="Articles" subtitle="Community stories, guides and expert advice." actions={<Link className="button" href="/admin/articles/new"><Plus/> New article</Link>}>
<nav className="topic-tabs dash-tabs" aria-label="Filter by status">{TABS.map(([v,label])=><Link key={v} className={(status||"")===v?"active":undefined} href={v?`/admin/articles?status=${v}`:"/admin/articles"}>{label}</Link>)}</nav>
<div className="dash-card flush">{data?.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Article</th><th>Category</th><th>Status</th><th aria-label="Actions"></th></tr></thead><tbody>{data.map(p=><tr key={p.id}>
<td><Link className="row-title" href={`/admin/articles/${p.id}`}>{p.title}</Link><small>{p.author_name||"Team BikeHub"} · {formatDate(p.published_at||p.created_at)}</small></td>
<td>{p.category}</td>
<td><div className="pill-row"><Pill value={p.status==="published"?"live":"hidden"} label={p.status==="published"?"Published":"Draft"}/>{p.is_expert_content&&<Pill value="verified" label="Expert"/>}</div></td>
<td><div className="row-actions"><Link className="icon-btn" href={`/admin/articles/${p.id}`} title="Edit article" aria-label={`Edit ${p.title}`}><Pencil/></Link>{p.status==="published"&&<Link className="icon-btn" href={`/community/${p.slug}`} target="_blank" title="View on site" aria-label={`View ${p.title} on site`}><ExternalLink/></Link>}</div></td></tr>)}</tbody></table></div>:<p className="dash-empty">No articles here yet.</p>}</div>
</DashShell>}
