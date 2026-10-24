"use client";
// Admin → Audits: bikes whose type the team should double-check. Pick the right type and confirm;
// confirmed bikes drop off the list and riders get the corrected type straight away.
import {useState} from "react";import {useRouter} from "next/navigation";import {Bike,Check,LoaderCircle} from "lucide-react";
import {BIKE_LEVELS,LEVEL_INFO,type BikeLevel} from "@/lib/matrix/config";
import {reviewBike} from "@/app/admin/matrix-actions";

export type ReviewBike={id:string;name:string;detail:string;level:BikeLevel};

export function BikeReviewList({bikes}:{bikes:ReviewBike[]}){
  const router=useRouter();
  const [levels,setLevels]=useState<Record<string,BikeLevel>>(()=>Object.fromEntries(bikes.map(b=>[b.id,b.level])));
  const [done,setDone]=useState<Set<string>>(new Set());const [busy,setBusy]=useState<string|null>(null);const [error,setError]=useState("");
  async function confirm(b:ReviewBike){
    setBusy(b.id);setError("");const r=await reviewBike(b.id,levels[b.id]);setBusy(null);
    if(r.error){setError(r.error);return}
    setDone(d=>new Set(d).add(b.id));router.refresh();
  }
  const left=bikes.filter(b=>!done.has(b.id));
  if(!left.length)return <p className="dash-empty">All bike types are checked. Nice work.</p>;
  return <div className="bike-review">
    <ul className="bike-review-list">{left.map(b=>{const changed=levels[b.id]!==b.level;return <li key={b.id}>
      <span className="tile-icon" aria-hidden="true"><Bike/></span>
      <div className="bike-review-name"><b>{b.name}</b><small>{b.detail}</small></div>
      <select className={`status-pick type-pick${changed?" changed":""}`} value={levels[b.id]} aria-label={`${b.name}: bike type`} onChange={e=>setLevels(x=>({...x,[b.id]:e.target.value as BikeLevel}))}>
        {BIKE_LEVELS.map(l=><option key={l} value={l}>{LEVEL_INFO[l].name}</option>)}</select>
      <button type="button" className={`button small${changed?"":" secondary"}`} onClick={()=>confirm(b)} disabled={busy===b.id}>{busy===b.id?<LoaderCircle className="spin"/>:<Check/>} {changed?"Save":"Looks right"}</button>
    </li>})}</ul>
    {error&&<p className="flash error" role="alert">{error}</p>}
  </div>;
}
