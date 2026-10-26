import Link from "next/link";import {DashShell,Flash,Pill} from "@/components/dashboard";import {requireStaff} from "@/lib/admin";import {ALL_CITIES} from "@/lib/listings";import {setCityLive} from "@/app/admin/actions";
export const metadata={title:"Cities · Admin"};
type City={name:string;is_live:boolean;updated_at:string|null};
export default async function AdminCities({searchParams}:{searchParams:Promise<{error?:string}>}){const {supabase}=await requireStaff();const sp=await searchParams;
const {data,error}=await supabase.from("cities").select("name,is_live,updated_at");
const saved=new Map(((data||[]) as City[]).map(c=>[c.name,c]));
// Every city we hold listings for, plus any added in the table; live ones first.
const names=[...new Set([...ALL_CITIES,...saved.keys()])];
const counts=await Promise.all(names.map(n=>supabase.from("service_centres").select("id",{count:"exact",head:true}).eq("city",n).eq("is_active",true).then(r=>r.count||0)));
const rows=names.map((name,i)=>({name,live:!!saved.get(name)?.is_live,listings:counts[i]})).sort((a,b)=>Number(b.live)-Number(a.live)||b.listings-a.listings||a.name.localeCompare(b.name));
const liveCount=rows.filter(r=>r.live).length;
return <DashShell area="admin" active="cities" title="Cities" subtitle={`${liveCount} of ${rows.length} cities are live. Riders only see shops in live cities; other cities show “coming soon”.`}>
<Flash error={sp.error||(error?`Couldn’t read the cities list: ${error.message}`:undefined)}/>
<div className="dash-card"><h2>Add a city</h2><p className="muted">Type the city name exactly as it appears on its listings. It goes live straight away, with all its shops.</p><form className="inline-form" action={setCityLive}><input name="name" required maxLength={80} placeholder="e.g. Agra" aria-label="City name"/><input type="hidden" name="live" value="true"/><button className="button small">Add and switch on</button></form></div>
<div className="dash-card flush"><div className="table-wrap"><table className="data-table"><thead><tr><th>City</th><th>Status</th><th>Shops</th><th aria-label="Actions"></th></tr></thead><tbody>{rows.map(c=><tr key={c.name}>
<td><b>{c.name}</b></td>
<td><Pill value={c.live?"live":"hidden"} label={c.live?"Live":"Switched off"}/></td>
<td><Link className="link" href={`/admin/listings?city=${encodeURIComponent(c.name)}`}>{c.listings.toLocaleString("en-IN")}</Link></td>
<td><div className="row-actions"><form action={setCityLive}><input type="hidden" name="name" value={c.name}/><input type="hidden" name="live" value={String(!c.live)}/><button className={`button small${c.live?" secondary":""}`}>{c.live?"Switch off":"Switch on"}</button></form></div></td></tr>)}</tbody></table></div></div>
</DashShell>}
