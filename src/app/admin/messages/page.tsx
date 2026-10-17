import {DashShell,Pill} from "@/components/dashboard";import {formatDate,requireStaff} from "@/lib/admin";import {markContactRead} from "../actions";
export const metadata={title:"Messages · Admin"};
export default async function AdminMessages(){const {supabase}=await requireStaff();
const {data}=await supabase.from("contact_messages").select("id,name,email,message,status,created_at").order("created_at",{ascending:false}).limit(100);
return <DashShell area="admin" active="messages" title="Messages" subtitle="Sent through the contact form, including listing claims and corrections.">
{data?.length?<div className="enquiry-list">{data.map(m=><article className={`dash-card enquiry${m.status==="new"?" unread":""}`} key={m.id}><header><div><b>{m.name}</b> <a className="link" href={`mailto:${m.email}`}>{m.email}</a></div><div className="feed-meta"><Pill value={m.status}/><small>{formatDate(m.created_at)}</small></div></header>
<p className="pre">{m.message}</p><footer><a className="button small" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to BikeHub")}`}>Reply by email</a><form action={markContactRead}><input type="hidden" name="id" value={m.id}/><input type="hidden" name="status" value={m.status==="new"?"read":"new"}/><button className="button secondary small">{m.status==="new"?"Mark as read":"Mark as unread"}</button></form></footer></article>)}</div>:<div className="dash-card"><p className="dash-empty">No messages yet.</p></div>}
</DashShell>}
