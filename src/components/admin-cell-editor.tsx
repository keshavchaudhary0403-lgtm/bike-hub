"use client";
// Admin → Listings: edit a shop's "What they can handle" grid directly.
// Each cell: blank, Shop says, Checked by BikeHub or Proven. Brands apply per row. A reason is required and logged.
import {useState} from "react";import {useRouter} from "next/navigation";import {LoaderCircle,Save} from "lucide-react";
import {BIKE_LEVELS,LEVEL_INFO,SERVICE_INFO,SERVICE_LEVELS,STATUS_INFO,meetsMinimum,type BikeLevel,type CellStatus,type ServiceLevel} from "@/lib/matrix/config";
import {adminSaveCells} from "@/app/admin/matrix-actions";

export type AdminGridCell={level:BikeLevel;service:ServiceLevel;status:CellStatus;brands:string[]};
const k=(l:string,s:string)=>`${l}|${s}`;

export function AdminCellEditor({shopId,cells}:{shopId:string;cells:AdminGridCell[]}){
  const router=useRouter();
  const initial=Object.fromEntries(cells.map(c=>[k(c.level,c.service),c.status])) as Record<string,CellStatus>;
  const [status,setStatus]=useState<Record<string,CellStatus|"">>(initial);
  const [brands,setBrands]=useState<Record<string,string>>(()=>Object.fromEntries(BIKE_LEVELS.map(l=>[l,(cells.find(c=>c.level===l)?.brands||[]).join(", ")])));
  const [note,setNote]=useState("");const [busy,setBusy]=useState(false);const [msg,setMsg]=useState<{ok:boolean;text:string}|null>(null);
  async function save(){
    setBusy(true);setMsg(null);
    const list=BIKE_LEVELS.flatMap(l=>SERVICE_LEVELS.map(s=>({level:l,service:s,status:status[k(l,s)]||null,brands:brands[l].split(",").map(x=>x.trim()).filter(Boolean)})))
      .filter(c=>c.status||initial[k(c.level,c.service)]);
    const r=await adminSaveCells(shopId,list,note);setBusy(false);
    if(r.error){setMsg({ok:false,text:r.error});return}
    setMsg({ok:true,text:r.changed?`Saved ${r.changed} change${r.changed===1?"":"s"}. Riders see them now.`:"Nothing changed."});setNote("");router.refresh();
  }
  return <div className="admin-cells">
    <p className="hint">Choose a status for each kind of bike and job. Blank = not offered. “Shop says” on big bikes, electronics and engine work stays hidden from riders until it is Checked.</p>
    <div className="cap-scroll" role="region" aria-label="Edit what they can handle" tabIndex={0}><table className="cap-grid editor-grid">
      <thead><tr><th scope="col">Kind of bike</th>{SERVICE_LEVELS.map(s=><th scope="col" key={s}>{SERVICE_INFO[s].name}</th>)}</tr></thead>
      <tbody>{BIKE_LEVELS.map(l=><tr key={l}><th scope="row"><b>{LEVEL_INFO[l].name}</b>
        <label className="row-brands"><span>Brands</span><input value={brands[l]} onChange={e=>setBrands(b=>({...b,[l]:e.target.value}))} placeholder="All brands" maxLength={200}/></label></th>
        {SERVICE_LEVELS.map(s=>{const v=status[k(l,s)]||"";return <td key={s} className={v?`st-${v}`:undefined}>
          <select className="cell-select" value={v} aria-label={`${LEVEL_INFO[l].name}: ${SERVICE_INFO[s].name}`} onChange={e=>setStatus(x=>({...x,[k(l,s)]:e.target.value as CellStatus|""}))}>
            <option value="">—</option>{(["claimed","visited","proven"] as CellStatus[]).map(st=><option key={st} value={st}>{STATUS_INFO[st].name}</option>)}</select>
          {v&&!meetsMinimum(l,s,v)&&<small className="needs-visit">hidden until checked</small>}</td>})}</tr>)}</tbody></table></div>
    <label className="field-label">Reason for the change<input className="field" value={note} onChange={e=>setNote(e.target.value)} maxLength={500} placeholder="e.g. Phoned the owner; saw dyno photos"/></label>
    <div className="dash-actions"><button type="button" className="button" onClick={save} disabled={busy}>{busy?<LoaderCircle className="spin"/>:<Save/>} Save grid</button></div>
    {msg&&<p className={msg.ok?"flash ok":"flash error"} role={msg.ok?"status":"alert"}>{msg.text}</p>}
  </div>;
}
