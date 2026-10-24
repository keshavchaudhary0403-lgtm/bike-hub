"use client";
// "What they can handle": one card per kind of bike, with the five kinds of job as status chips.
// The rider's own bike type is highlighted and listed first. The chips carry their status in words,
// so screen readers and colour-blind riders get the same information.
import {Cog,Cpu,Gauge,Hammer,Wrench} from "lucide-react";
import {BIKE_LEVELS,LEVEL_INFO,SERVICE_INFO,SERVICE_LEVELS,STATUS_INFO,meetsMinimum,type BikeLevel,type CellStatus,type ServiceLevel} from "@/lib/matrix/config";
import {useRiderBike} from "@/lib/matrix/rider-bike";

export type GridCell={level:BikeLevel;service:string;status:CellStatus;brands:string[]};
export const JOB_ICONS:Record<ServiceLevel,typeof Wrench>={S1:Wrench,S2:Hammer,S3:Cpu,S4:Cog,S5:Gauge};
/** Two or three example bikes, enough to recognise the kind of bike. */
export const shortExamples=(l:BikeLevel)=>LEVEL_INFO[l].examples.split(",").slice(0,3).map(x=>x.trim()).join(", ");
const STATUS_SHORT:Record<CellStatus,string>={proven:"Proven",visited:"Checked",claimed:"Shop says"};

/** Brands shared by every cell of a row ("Kawasaki only"), or null when the row covers all brands or mixes. */
function rowBrands(cells:GridCell[]){
  const sets=cells.map(c=>c.brands.join(", "));
  return sets.length&&sets.every(s=>s&&s===sets[0])?sets[0]:null;
}

/** `all` (staff only) also shows claims still waiting for a BikeHub visit. */
export function CapabilityGrid({cells,shopName,all}:{cells:GridCell[];shopName:string;all?:boolean}){
  const mine=useRiderBike()?.level??null;
  const shown=all?cells:cells.filter(c=>meetsMinimum(c.level,c.service as ServiceLevel,c.status));
  if(!shown.length)return <p className="muted">BikeHub hasn’t checked what bikes {shopName} can handle yet, and the shop hasn’t told us. Call ahead to ask about your bike.</p>;
  const rows=BIKE_LEVELS.filter(l=>shown.some(c=>c.level===l)||l===mine).sort((a,b)=>Number(b===mine)-Number(a===mine));
  return <div className="handles">
    <ul className="handles-rows">{rows.map(l=>{const rowCells=shown.filter(c=>c.level===l);const brands=rowBrands(rowCells);
      return <li key={l} className={`handles-row${l===mine?" mine":""}`}>
        <div className="handles-bike"><b>{LEVEL_INFO[l].name}</b>{l===mine&&<span className="chip">Your bike</span>}{brands&&<span className="chip brand">{brands} only</span>}<small>{shortExamples(l)}</small></div>
        <ul className="handles-jobs" aria-label={`${LEVEL_INFO[l].name}: jobs`}>{SERVICE_LEVELS.map(s=>{const c=rowCells.find(x=>x.service===s);const Icon=JOB_ICONS[s];
          const waiting=c&&!meetsMinimum(l,s,c.status);
          return <li key={s} className={`job ${c?`st-${c.status}`:"st-none"}`} title={SERVICE_INFO[s].covers}><Icon aria-hidden="true"/><span><b>{SERVICE_INFO[s].name}</b><small>{c?`${STATUS_SHORT[c.status]}${waiting?" · hidden until checked":""}${!brands&&c.brands.length?` · ${c.brands.join(", ")}`:""}`:"Not listed"}</small></span></li>})}</ul>
      </li>})}</ul>
    <ul className="handles-legend">{(["proven","visited","claimed"] as CellStatus[]).map(s=><li key={s} title={STATUS_INFO[s].explain}><span className={`dot st-${s}`} aria-hidden="true"/>{STATUS_INFO[s].name}</li>)}<li><span className="dot st-none" aria-hidden="true"/>Not listed: call ahead</li></ul>
  </div>;
}
