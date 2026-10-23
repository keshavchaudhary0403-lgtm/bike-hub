import Link from "next/link";import {ArrowRight} from "lucide-react";import {DashShell,Pill,Stat} from "@/components/dashboard";import {formatDate,requireStaff} from "@/lib/admin";
export const metadata={title:"Admin"};
type Enquiry={id:string;name:string;service_need:string;status:string;created_at:string;service_centres:{name:string}|null};
export default async function AdminOverview(){const {supabase,profile}=await requireStaff();
const count=(build:(q:ReturnType<typeof base>)=>ReturnType<typeof base>)=>build(base()).then(r=>r.count||0);
function base(){return supabase.from("service_centres").select("id",{count:"exact",head:true})}
const waiting=(table:string,status:string)=>supabase.from(table).select("id",{count:"exact",head:true}).eq("status",status).then(r=>r.count||0);
const [sc,rs,gs,hidden,pending,verified,newEnq,newMsg,{data:enquiries},{data:messages},modReviews,modComments,modStories,liveRoutes,livePosts]=await Promise.all([
  count(q=>q.eq("is_active",true).eq("listing_type","service_centre")),count(q=>q.eq("is_active",true).eq("listing_type","repair_shop")),count(q=>q.eq("is_active",true).eq("listing_type","gear_shop")),
  count(q=>q.eq("is_active",false)),count(q=>q.eq("verification_status","pending")),count(q=>q.eq("verification_status","verified")),
  supabase.from("enquiries").select("id",{count:"exact",head:true}).eq("status","new").then(r=>r.count||0),
  supabase.from("contact_messages").select("id",{count:"exact",head:true}).eq("status","new").then(r=>r.count||0),
  supabase.from("enquiries").select("id,name,service_need,status,created_at,service_centres(name)").order("created_at",{ascending:false}).limit(5),
  supabase.from("contact_messages").select("id,name,message,status,created_at").order("created_at",{ascending:false}).limit(5),
  waiting("reviews","draft"),waiting("comments","draft"),waiting("story_submissions","new"),waiting("routes","published"),waiting("posts","published")]);
const enq=(enquiries||[]) as unknown as Enquiry[];
return <DashShell area="admin" active="overview" title={`Welcome back${profile?.display_name?`, ${profile.display_name}`:""}`} subtitle="Here’s what’s happening on BikeHub." badges={{enquiries:newEnq,messages:newMsg,moderation:modReviews+modComments+modStories}}>
<div className="stat-grid"><Stat label="Service centres" value={sc} href="/admin/listings?type=service_centre"/><Stat label="Repair shops" value={rs} href="/admin/listings?type=repair_shop"/><Stat label="Gear shops" value={gs} href="/admin/listings?type=gear_shop"/><Stat label="Hidden listings" value={hidden} href="/admin/listings?visibility=hidden"/></div>
<div className="stat-grid"><Stat label="Awaiting verification" value={pending} href="/admin/listings?verification=pending" tone="amber"/><Stat label="Verified" value={verified} href="/admin/listings?verification=verified" tone="green"/><Stat label="New enquiries" value={newEnq} href="/admin/enquiries?status=new" tone="blue"/><Stat label="Unread messages" value={newMsg} href="/admin/messages" tone="blue"/></div>
<div className="stat-grid"><Stat label="Reviews to approve" value={modReviews} href="/admin/moderation?tab=reviews" tone="amber"/><Stat label="Comments to approve" value={modComments} href="/admin/moderation?tab=comments" tone="amber"/><Stat label="Stories sent in" value={modStories} href="/admin/moderation?tab=stories" tone="amber"/><Stat label="Live routes · articles" value={`${liveRoutes} · ${livePosts}`} href="/admin/articles"/></div>
<div className="dash-two">
<div className="dash-card"><div className="dash-card-head"><h2>Latest enquiries</h2><Link className="link" href="/admin/enquiries">View all <ArrowRight size={15}/></Link></div>{enq.length?<ul className="feed">{enq.map(e=><li key={e.id}><div><b>{e.name}</b> <span className="muted">→ {e.service_centres?.name||"Unknown listing"}</span><p>{e.service_need}</p></div><div className="feed-meta"><Pill value={e.status}/><small>{formatDate(e.created_at)}</small></div></li>)}</ul>:<p className="dash-empty">No enquiries yet.</p>}</div>
<div className="dash-card"><div className="dash-card-head"><h2>Latest messages</h2><Link className="link" href="/admin/messages">View all <ArrowRight size={15}/></Link></div>{messages?.length?<ul className="feed">{messages.map(m=><li key={m.id}><div><b>{m.name}</b><p>{m.message}</p></div><div className="feed-meta"><Pill value={m.status}/><small>{formatDate(m.created_at)}</small></div></li>)}</ul>:<p className="dash-empty">No messages yet.</p>}</div>
</div></DashShell>}
