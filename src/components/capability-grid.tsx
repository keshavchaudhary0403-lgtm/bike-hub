"use client";
// "What they can handle": kinds of bike down the side, kinds of job across the top.
// The rider's own row is highlighted. It is a real table, so screen readers get row and column names,
// and a one-line summary above it gives the same information in words.
import {BIKE_LEVELS,LEVEL_INFO,SERVICE_INFO,SERVICE_LEVELS,STATUS_INFO,meetsMinimum,type BikeLevel,type CellStatus} from "@/lib/matrix/config";
import {useRiderBike} from "@/lib/matrix/rider-bike";

export type GridCell={level:BikeLevel;service:string;status:CellStatus;brands:string[]};

/** Only cells riders may see: verified ones, and claims where a claim is enough. */
const visible=(cells:GridCell[])=>cells.filter(c=>meetsMinimum(c.level,c.service as never,c.status));

export function CapabilityGrid({cells,shopName}:{cells:GridCell[];shopName:string}){
  const mine=useRiderBike()?.level??null;
  const shown=visible(cells);
  const at=(l:BikeLevel,s:string)=>shown.find(c=>c.level===l&&c.service===s);
  const rows=BIKE_LEVELS.filter(l=>shown.some(c=>c.level===l)||l===mine);
  if(!shown.length)return <p className="muted">BikeHub hasn’t checked what bikes {shopName} can handle yet, and the shop hasn’t told us. Call ahead to ask about your bike.</p>;
  const summary=BIKE_LEVELS.filter(l=>shown.some(c=>c.level===l)).map(l=>`${LEVEL_INFO[l].name}: ${SERVICE_LEVELS.filter(s=>at(l,s)).map(s=>`${SERVICE_INFO[s].name.toLowerCase()} (${STATUS_INFO[at(l,s)!.status].name.toLowerCase()})`).join(", ")}`).join(". ");
  return <div className="cap-grid-wrap">
    <p className="sr-only">In short: {summary}.</p>
    <div className="cap-scroll" role="region" aria-label="What they can handle" tabIndex={0}><table className="cap-grid">
      <caption className="sr-only">Kinds of bike {shopName} can handle, by kind of job</caption>
      <thead><tr><th scope="col">Your bike type</th>{SERVICE_LEVELS.map(s=><th scope="col" key={s} title={SERVICE_INFO[s].covers}>{SERVICE_INFO[s].name}</th>)}</tr></thead>
      <tbody>{rows.map(l=><tr key={l} className={l===mine?"mine":undefined}><th scope="row"><b>{LEVEL_INFO[l].name}{l===mine&&<em className="your-row"> · your bike</em>}</b><small>{LEVEL_INFO[l].examples}</small></th>
        {SERVICE_LEVELS.map(s=>{const c=at(l,s);return <td key={s} className={c?`st-${c.status}`:"st-none"}>{c?<><span>{STATUS_INFO[c.status].short}</span>{c.brands.length>0&&<small>{c.brands.join(", ")} only</small>}</>:<span className="sr-only">Not listed</span>}</td>})}</tr>)}</tbody>
    </table></div>
    <ul className="cap-legend">{(["proven","visited","claimed"] as CellStatus[]).map(s=><li key={s}><span className={`dot st-${s}`} aria-hidden="true"/><b>{STATUS_INFO[s].name}</b> {STATUS_INFO[s].explain}</li>)}<li><span className="dot st-none" aria-hidden="true"/><b>Blank</b> Not checked or not offered. Call ahead to ask.</li></ul>
  </div>;
}
