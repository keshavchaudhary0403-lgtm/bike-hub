import Link from "next/link";import {Check,EyeOff,FilePlus2,Mail,Trash2,X} from "lucide-react";import {DashShell,Flash,Pill} from "@/components/dashboard";import {Stars} from "@/components/ui";import {formatDate,requireStaff} from "@/lib/admin";import {moderate,setStoryStatus,storyToDraft} from "../content-actions";
export const metadata={title:"Approvals · Admin"};
type Tab="reviews"|"comments"|"stories";
type ReviewRow={id:string;reviewer_name:string;overall_rating:number;body:string|null;service_used:string|null;status:string;created_at:string;service_centres:{name:string;slug:string;city:string}|null};
type CommentRow={id:string;display_name:string;body:string;status:string;created_at:string;posts:{title:string;slug:string}|null};
type StoryRow={id:string;name:string;email:string;title:string;category:string;body:string;status:string;created_at:string};
const LABELS:Record<string,string>={draft:"Waiting",published:"Approved",archived:"Hidden",new:"New",accepted:"Accepted",declined:"Declined"};

/** Approve / hide / delete buttons for a review or comment. */
function Decide({kind,id,status}:{kind:"review"|"comment";id:string;status:string}){
  const btn=(action:string,label:React.ReactNode,cls="secondary")=><form action={moderate}><input type="hidden" name="kind" value={kind}/><input type="hidden" name="id" value={id}/><input type="hidden" name="action" value={action}/><button className={`button ${cls} small`}>{label}</button></form>;
  return <div className="dash-actions">{status!=="published"&&btn("approve",<><Check/> Approve</>,"")}{status!=="archived"&&btn("hide",<><EyeOff/> {status==="published"?"Hide":"Reject"}</>)}{btn("delete",<><Trash2/> Delete</>)}</div>;
}

export default async function Approvals({searchParams}:{searchParams:Promise<{tab?:string;show?:string;error?:string}>}){const {supabase}=await requireStaff();const sp=await searchParams;
const tab:Tab=sp.tab==="comments"||sp.tab==="stories"?sp.tab:"reviews";const all=sp.show==="all";
const waiting=(table:string,status:string)=>supabase.from(table).select("id",{count:"exact",head:true}).eq("status",status).then(r=>r.count||0);
const [nReviews,nComments,nStories]=await Promise.all([waiting("reviews","draft"),waiting("comments","draft"),waiting("story_submissions","new")]);
const pendingStatus=tab==="stories"?"new":"draft";
const table=tab==="stories"?"story_submissions":tab;
const fields=tab==="reviews"?"id,reviewer_name,overall_rating,body,service_used,status,created_at,service_centres(name,slug,city)":tab==="comments"?"id,display_name,body,status,created_at,posts(title,slug)":"id,name,email,title,category,body,status,created_at";
let q=supabase.from(table).select(fields).order("created_at",{ascending:false}).limit(100);if(!all)q=q.eq("status",pendingStatus);
const {data}=await q;const rows=(data||[]) as unknown[];
const tabHref=(t:Tab,show?:string)=>`/admin/approvals?tab=${t}${show?`&show=${show}`:""}`;
return <DashShell area="admin" active="approvals" title="Approvals" subtitle="Reviews, comments and stories from riders. Nothing goes on the website until you approve it." badges={{approvals:nReviews+nComments+nStories}}>
<Flash error={sp.error}/>
<nav className="topic-tabs dash-tabs" aria-label="What to review">{([["reviews","Reviews",nReviews],["comments","Comments",nComments],["stories","Stories",nStories]] as const).map(([t,label,n])=><Link key={t} className={tab===t?"active":undefined} href={tabHref(t)}>{label}{n>0&&<em className="tab-count">{n}</em>}</Link>)}</nav>
<p className="hint mod-filter">{all?<>Showing everything. <Link href={tabHref(tab)}>Show only waiting</Link></>:<>Showing items waiting for you. <Link href={tabHref(tab,"all")}>Show all, including approved and hidden</Link></>}</p>
{rows.length===0?<div className="dash-card"><p className="dash-empty">{all?"Nothing here yet.":"All caught up. Nothing is waiting."}</p></div>:<div className="enquiry-list">
{tab==="reviews"&&(rows as ReviewRow[]).map(r=><article className={`dash-card enquiry${r.status==="draft"?" unread":""}`} key={r.id}><header><div><Stars value={r.overall_rating}/> <b>{r.reviewer_name}</b><span className="muted"> → {r.service_centres?<Link className="link" href={`/services/${r.service_centres.slug}`} target="_blank">{r.service_centres.name}</Link>:"Unknown listing"}{r.service_centres?.city?`, ${r.service_centres.city}`:""}</span></div><div className="feed-meta"><Pill value={r.status} label={LABELS[r.status]}/><small>{formatDate(r.created_at)}</small></div></header>
{r.service_used&&<p className="muted">Work done: {r.service_used}</p>}{r.body?<p className="pre">{r.body}</p>:<p className="muted">Star rating only, no text.</p>}<footer><Decide kind="review" id={r.id} status={r.status}/></footer></article>)}
{tab==="comments"&&(rows as CommentRow[]).map(c=><article className={`dash-card enquiry${c.status==="draft"?" unread":""}`} key={c.id}><header><div><b>{c.display_name}</b><span className="muted"> on {c.posts?<Link className="link" href={`/community/${c.posts.slug}`} target="_blank">{c.posts.title}</Link>:"a deleted article"}</span></div><div className="feed-meta"><Pill value={c.status} label={LABELS[c.status]}/><small>{formatDate(c.created_at)}</small></div></header>
<p className="pre">{c.body}</p><footer><Decide kind="comment" id={c.id} status={c.status}/></footer></article>)}
{tab==="stories"&&(rows as StoryRow[]).map(s=><article className={`dash-card enquiry${s.status==="new"?" unread":""}`} key={s.id}><header><div><b>{s.title}</b><span className="muted"> · {s.category} · by {s.name}</span></div><div className="feed-meta"><Pill value={s.status==="new"?"new":s.status==="accepted"?"published":"archived"} label={LABELS[s.status]}/><small>{formatDate(s.created_at)}</small></div></header>
<details className="story-body"><summary>Read the story ({s.body.split(/\s+/).length.toLocaleString("en-IN")} words)</summary><p className="pre">{s.body}</p></details>
<footer><div className="dash-actions"><form action={storyToDraft}><input type="hidden" name="id" value={s.id}/><button className="button small"><FilePlus2/> Turn into article draft</button></form>
<a className="button secondary small" href={`mailto:${s.email}?subject=${encodeURIComponent(`Your BikeHub story: ${s.title}`)}`}><Mail/> Email {s.name.split(" ")[0]}</a>
{s.status!=="declined"&&<form action={setStoryStatus}><input type="hidden" name="id" value={s.id}/><input type="hidden" name="status" value="declined"/><button className="button secondary small"><X/> Decline</button></form>}</div></footer></article>)}
</div>}
</DashShell>}
