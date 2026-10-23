import Link from "next/link";import {ExternalLink,Pencil,Plus} from "lucide-react";import {DashShell,Pill} from "@/components/dashboard";import {requireStaff} from "@/lib/admin";
export const metadata={title:"Routes · Admin"};
export default async function AdminRoutes(){const {supabase}=await requireStaff();
const {data}=await supabase.from("routes").select("id,slug,name,start_location,end_location,distance_km,difficulty,status,is_featured").order("is_featured",{ascending:false}).order("created_at");
return <DashShell area="admin" active="routes" title="Routes" subtitle="Riding routes shown on Rides & Events and the homepage." actions={<Link className="button" href="/admin/routes/new"><Plus/> New route</Link>}>
<div className="dash-card flush">{data?.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Route</th><th>Distance</th><th>Status</th><th aria-label="Actions"></th></tr></thead><tbody>{data.map(r=><tr key={r.id}>
<td><Link className="row-title" href={`/admin/routes/${r.id}`}>{r.name}</Link><small>{[r.start_location&&r.end_location?`${r.start_location} → ${r.end_location}`:null,r.difficulty].filter(Boolean).join(" · ")}</small></td>
<td>{r.distance_km?`${r.distance_km.toLocaleString("en-IN")} km`:<span className="muted">—</span>}</td>
<td><div className="pill-row"><Pill value={r.status==="published"?"live":"hidden"} label={r.status==="published"?"Published":"Draft"}/>{r.is_featured&&<Pill value="verified" label="Shown first"/>}</div></td>
<td><div className="row-actions"><Link className="icon-btn" href={`/admin/routes/${r.id}`} title="Edit route" aria-label={`Edit ${r.name}`}><Pencil/></Link>{r.status==="published"&&<Link className="icon-btn" href={`/routes/${r.slug}`} target="_blank" title="View on site" aria-label={`View ${r.name} on site`}><ExternalLink/></Link>}</div></td></tr>)}</tbody></table></div>:<p className="dash-empty">No routes yet. Add the first one.</p>}</div>
</DashShell>}
