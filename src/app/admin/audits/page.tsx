import Link from "next/link";import {AlertTriangle,ClipboardCheck,Search} from "lucide-react";import {DashShell,Flash,Pill} from "@/components/dashboard";import {escapeLike,formatDate,requireStaff} from "@/lib/admin";
import {setRequestStatus} from "../matrix-actions";import {cellLabel,isBikeLevel,isServiceLevel} from "@/lib/matrix/config";import {BIKE_MODELS,bikeName} from "@/data/bike-models";import {BikeReviewList,type ReviewBike} from "@/components/bike-review";
export const metadata={title:"Audits · Admin"};
type Req={id:string;cells:[string,string][];note:string|null;status:string;created_at:string;service_centres:{id:string;name:string;city:string;phone:string|null}|null};
type Audit={id:string;visited_at:string;auditor_name:string|null;result_cells:unknown[];service_centres:{id:string;name:string;city:string;slug:string}|null};
type Alert={id:number;bike_level:string;service_level:string;note:string|null;created_at:string;service_centres:{id:string;name:string;city:string}|null};
/** Server-side cut-off for recent alerts. */
const daysAgo=(n:number)=>new Date(Date.now()-n*864e5).toISOString();
const label=(l:string,s:string)=>isBikeLevel(l)&&isServiceLevel(s)?cellLabel(l,s):`${l} – ${s}`;

export default async function Audits({searchParams}:{searchParams:Promise<{q?:string;saved?:string;error?:string}>}){const {supabase}=await requireStaff();const sp=await searchParams;const q=sp.q?.trim();
const since=daysAgo(90);
const [{data:reqs},{data:audits},{data:alerts},{data:found}]=await Promise.all([
  supabase.from("audit_requests").select("id,cells,note,status,created_at,service_centres(id,name,city,phone)").in("status",["new","scheduled"]).order("created_at"),
  supabase.from("shop_audits").select("id,visited_at,auditor_name,result_cells,service_centres(id,name,city,slug)").order("created_at",{ascending:false}).limit(20),
  supabase.from("capability_log").select("id,bike_level,service_level,note,created_at,service_centres(id,name,city)").eq("source","reports").eq("to_status","claimed").gte("created_at",since).order("created_at",{ascending:false}).limit(30),
  q?supabase.from("service_centres").select("id,name,city,locality,listing_type").ilike("search_text",`%${escapeLike(q.toLowerCase())}%`).neq("listing_type","gear_shop").order("name").limit(20):Promise.resolve({data:null})]);
const requests=(reqs||[]) as unknown as Req[];const recent=(audits||[]) as unknown as Audit[];const downgrades=(alerts||[]) as unknown as Alert[];
const {data:pending}=await supabase.from("bike_models").select("id,bike_level").eq("needs_review",true);
const review:ReviewBike[]=(pending||[]).flatMap(r=>{const m=BIKE_MODELS.find(x=>x.id===r.id);return m&&isBikeLevel(r.bike_level)?[{id:m.id,name:bikeName(m),detail:[m.cc?`${m.cc}cc`:"electric",m.years].filter(Boolean).join(" · "),level:r.bike_level}]:[]}).sort((a,b)=>a.name.localeCompare(b.name));
return <DashShell area="admin" active="audits" title="Audits" subtitle="Shop visits that mark what a workshop can handle as “Checked by BikeHub”." badges={{audits:requests.length+downgrades.length}}>
<Flash saved={sp.saved} error={sp.error}/>
<div className="dash-card"><h2><ClipboardCheck size={18}/> Start an audit</h2><form className="inline-form" action="/admin/audits"><input name="q" defaultValue={q} placeholder="Shop name, area or city" aria-label="Find a shop"/><button className="button secondary small"><Search/> Find</button></form>
{found&&(found.length?<ul className="feed">{found.map(s=><li key={s.id}><div><b>{s.name}</b> <span className="muted">{[s.locality,s.city].filter(Boolean).join(", ")}</span></div><Link className="button small" href={`/admin/audits/new?shop=${s.id}`}>Start audit</Link></li>)}</ul>:<p className="dash-empty">No shops match.</p>)}</div>
{downgrades.length>0&&<div className="dash-card alert-card"><h2><AlertTriangle size={18}/> Downgraded by poor reviews</h2><p className="hint">These cells dropped back to “Shop says” after 3+ approved reviews averaged under 2.5. Visit again before restoring them.</p>
<ul className="feed">{downgrades.map(a=><li key={a.id}><div><b>{a.service_centres?.name||"Unknown"}</b> <span className="muted">{a.service_centres?.city}</span><p>{label(a.bike_level,a.service_level)} · {a.note}</p></div><div className="feed-meta"><small>{formatDate(a.created_at)}</small>{a.service_centres&&<Link className="button secondary small" href={`/admin/audits/new?shop=${a.service_centres.id}`}>Re-audit</Link>}</div></li>)}</ul></div>}
<div className="dash-card"><h2>Visit requests</h2>{requests.length?<ul className="feed">{requests.map(r=><li key={r.id}><div><b>{r.service_centres?.name||"Unknown"}</b> <span className="muted">{r.service_centres?.city}{r.service_centres?.phone?` · ${r.service_centres.phone}`:""}</span>
  <p>{(r.cells||[]).map(([l,s])=>label(l,s)).join("; ")||"General visit"}</p>{r.note&&<p className="muted">“{r.note}”</p>}</div>
  <div className="feed-meta"><Pill value={r.status==="new"?"new":"pending"} label={r.status==="new"?"New":"Scheduled"}/><small>{formatDate(r.created_at)}</small>
  <div className="dash-actions">{r.service_centres&&<Link className="button small" href={`/admin/audits/new?shop=${r.service_centres.id}`}>Start audit</Link>}
  {r.status==="new"&&<form action={setRequestStatus}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="status" value="scheduled"/><button className="button secondary small">Mark scheduled</button></form>}
  <form action={setRequestStatus}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="status" value="declined"/><button className="button secondary small">Decline</button></form></div></div></li>)}</ul>:<p className="dash-empty">No visit requests waiting.</p>}</div>
<div className="dash-card"><h2>Recent audits</h2>{recent.length?<ul className="feed">{recent.map(a=><li key={a.id}><div><b>{a.service_centres?.name||"Unknown"}</b> <span className="muted">{a.service_centres?.city}</span><p>{(a.result_cells||[]).length} cells checked{a.auditor_name?` · by ${a.auditor_name}`:""}</p></div><div className="feed-meta"><small>{formatDate(a.visited_at)}</small>{a.service_centres&&<Link className="link" href={`/services/${a.service_centres.slug}#handles`} target="_blank">View listing</Link>}</div></li>)}</ul>:<p className="dash-empty">No audits yet.</p>}</div>
<div className="dash-card" id="bike-types"><div className="dash-card-head"><h2>Bike types to double-check</h2>{review.length>0&&<span className="muted">{review.length} left</span>}</div>
<p className="hint">We were less sure about these. Pick the right type if it’s wrong, or tap “Looks right”. Riders get the change straight away.</p>
<BikeReviewList bikes={review}/></div>
</DashShell>}
