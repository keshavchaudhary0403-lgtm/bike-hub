"use client";
// Partner footprint editor: tick the kinds of bike and job your workshop handles.
// Ticks are "Shop says" claims. Where riders need more than a claim (big bikes, electronics, engine work…)
// the cell waits for a BikeHub visit, which the partner can request here.
import Image from "next/image";import {useRef,useState} from "react";import {useRouter} from "next/navigation";
import {Camera,Check,LoaderCircle,Lock,Save,Send,Trash2} from "lucide-react";
import {BIKE_LEVELS,LEVEL_INFO,SERVICE_INFO,SERVICE_LEVELS,SKILLS,SKILL_INFO,STATUS_INFO,claimIsEnough,type BikeLevel,type CellStatus,type ServiceLevel} from "@/lib/matrix/config";
import {addEvidence,removeEvidence,requestVisit,saveFootprint} from "@/app/partner/actions";
import {createClient} from "@/lib/supabase-browser";import {photoUrl} from "@/lib/listings";import {shrink} from "@/components/photo-manager";

export type EditorCell={level:BikeLevel;service:ServiceLevel;status:CellStatus;brands:string[]};
export type Evidence={id:string;level:string|null;service:string|null;path:string;note:string|null};
const key=(l:string,s:string)=>`${l}|${s}`;

export function FootprintEditor({centreId,cells,skills:initialSkills,evidence:initialEvidence,openRequest}:{centreId:string;cells:EditorCell[];skills:string[];evidence:Evidence[];openRequest:boolean}){
  const router=useRouter();
  const locked=new Map(cells.filter(c=>c.status!=="claimed").map(c=>[key(c.level,c.service),c]));
  const [ticked,setTicked]=useState(()=>new Set(cells.map(c=>key(c.level,c.service))));
  const [brands,setBrands]=useState<Record<string,string>>(()=>Object.fromEntries(BIKE_LEVELS.map(l=>[l,(cells.find(c=>c.level===l&&c.status==="claimed")?.brands||[]).join(", ")])));
  const [skills,setSkills]=useState(new Set(initialSkills));
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState<{ok:boolean;text:string}|null>(null);
  const [requested,setRequested]=useState(openRequest);const [note,setNote]=useState("");
  const toggle=(k:string)=>setTicked(t=>{const n=new Set(t);if(n.has(k))n.delete(k);else n.add(k);return n});
  const needsVisit=[...ticked].filter(k=>!locked.has(k)).map(k=>k.split("|") as [BikeLevel,ServiceLevel]).filter(([l,s])=>!claimIsEnough(l,s));

  async function save(){
    setBusy(true);setMessage(null);
    const r=await saveFootprint(centreId,{cells:[...ticked].filter(k=>!locked.has(k)).map(k=>{const [level,service]=k.split("|");return {level,service}}),
      rowBrands:Object.fromEntries(Object.entries(brands).map(([l,v])=>[l,v.split(",").map(x=>x.trim()).filter(Boolean)])),skills:[...skills]});
    setBusy(false);setMessage(r.error?{ok:false,text:r.error}:{ok:true,text:"Saved. Riders see your ticks as “Shop says” where a claim is enough."});
    if(!r.error)router.refresh();
  }
  async function askVisit(){
    setBusy(true);setMessage(null);
    const r=await requestVisit(centreId,needsVisit.map(([level,service])=>({level,service})),note);
    setBusy(false);if(r.error)setMessage({ok:false,text:r.error});else{setRequested(true);setMessage({ok:true,text:"Visit requested. BikeHub will call you to fix a time."})}
  }

  return <div className="dash-card footprint">
    <div className="dash-card-head"><h2>What your workshop can handle</h2></div>
    <p className="hint">Tick each kind of bike and job you can do well. Leave brands empty if you work on every brand of that kind of bike.</p>
    <div className="cap-scroll" role="region" aria-label="What your workshop can handle" tabIndex={0}><table className="cap-grid editor-grid">
      <thead><tr><th scope="col">Kind of bike</th>{SERVICE_LEVELS.map(s=><th scope="col" key={s} title={SERVICE_INFO[s].covers}>{SERVICE_INFO[s].name}</th>)}</tr></thead>
      <tbody>{BIKE_LEVELS.map(l=><tr key={l}><th scope="row"><b>{LEVEL_INFO[l].name}</b><small>{LEVEL_INFO[l].examples}</small>
        <label className="row-brands"><span>Brands</span><input value={brands[l]} onChange={e=>setBrands(b=>({...b,[l]:e.target.value}))} placeholder="All brands" maxLength={200}/></label></th>
        {SERVICE_LEVELS.map(s=>{const k=key(l,s);const lock=locked.get(k);const on=ticked.has(k);const label=`${LEVEL_INFO[l].name}: ${SERVICE_INFO[s].name}`;
          if(lock)return <td key={s} className={`st-${lock.status}`}><span><Lock size={12} aria-hidden="true"/> {STATUS_INFO[lock.status].short}</span><small>Set by BikeHub</small></td>;
          return <td key={s} className={on?"ticked":undefined}><label className="tick"><input type="checkbox" checked={on} onChange={()=>toggle(k)} aria-label={label}/><span aria-hidden="true">{on?<Check size={16}/>:null}</span></label>{on&&!claimIsEnough(l,s)&&<small className="needs-visit">Needs a BikeHub visit</small>}</td>;})}
      </tr>)}</tbody></table></div>
    <fieldset className="skills"><legend>Specialities</legend>{SKILLS.map(s=><label key={s} className="switch"><input type="checkbox" checked={skills.has(s)} onChange={()=>setSkills(x=>{const n=new Set(x);if(n.has(s))n.delete(s);else n.add(s);return n})}/><span>{SKILL_INFO[s].name}</span></label>)}</fieldset>
    <div className="dash-actions"><button type="button" className="button" onClick={save} disabled={busy}>{busy?<LoaderCircle className="spin"/>:<Save/>} Save</button></div>
    {message&&<p className={message.ok?"flash ok":"flash error"} role={message.ok?"status":"alert"}>{message.text}</p>}
    {needsVisit.length>0&&<div className="visit-box"><h3>Needs a BikeHub visit</h3>
      <p className="hint">Riders only see these once a BikeHub team member has visited and seen the tools and skills: {needsVisit.map(([l,s])=>`${LEVEL_INFO[l].name} – ${SERVICE_INFO[s].name.toLowerCase()}`).join("; ")}.</p>
      {requested?<p className="flash ok" role="status">Visit requested. We’ll be in touch.</p>:<><label className="field-label">Anything we should know? <span className="optional">(optional)</span><textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={1000} placeholder="Best days to visit, equipment you have"/></label>
      <button type="button" className="button secondary" onClick={async()=>{await save();await askVisit()}} disabled={busy}><Send/> Save and request visit</button></>}</div>}
    <EvidencePhotos centreId={centreId} initial={initialEvidence} cells={[...ticked].map(k=>k.split("|") as [BikeLevel,ServiceLevel])}/>
  </div>;
}

/** Photos that back up the ticks: diagnostic scanner screen, equipment, bikes in the workshop. */
function EvidencePhotos({centreId,initial,cells}:{centreId:string;initial:Evidence[];cells:[BikeLevel,ServiceLevel][]}){
  const [items,setItems]=useState(initial);const [cell,setCell]=useState("");const [note,setNote]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const input=useRef<HTMLInputElement>(null);
  async function upload(files:FileList|null){
    if(!files?.length)return;setBusy(true);setError("");const supabase=createClient();
    try{for(const file of [...files].slice(0,6)){
      let blob:Blob;try{blob=await shrink(file)}catch{setError(`${file.name} couldn’t be read.`);continue}
      const path=`${centreId}/evidence/${crypto.randomUUID()}.jpg`;
      const {error:up}=await supabase.storage.from("listing-photos").upload(path,blob,{contentType:"image/jpeg"});if(up){setError(`Upload failed: ${up.message}`);continue}
      const [level,service]=cell?cell.split("|"):[null,null];
      const r=await addEvidence(centreId,path,level,service,note);
      if(r.error||!r.id){setError(r.error||"Could not save the photo.");await supabase.storage.from("listing-photos").remove([path]);continue}
      setItems(x=>[...x,{id:r.id!,level,service,path,note:note||null}]);
    }}finally{setBusy(false);setNote("");if(input.current)input.current.value=""}
  }
  const cellName=(l:string|null,s:string|null)=>l&&s&&l in LEVEL_INFO&&s in SERVICE_INFO?`${LEVEL_INFO[l as BikeLevel].name} – ${SERVICE_INFO[s as ServiceLevel].name}`:"General";
  return <div className="evidence"><h3>Photos for BikeHub</h3><p className="hint">Help us check your ticks: your diagnostic scanner screen, special tools, bikes you’re working on. Only BikeHub sees these.</p>
    <div className="form-row"><label className="field-label">For<select className="field" value={cell} onChange={e=>setCell(e.target.value)}><option value="">General</option>{cells.map(([l,s])=><option key={key(l,s)} value={key(l,s)}>{cellName(l,s)}</option>)}</select></label>
      <label className="field-label">Note <span className="optional">(optional)</span><input className="field" value={note} onChange={e=>setNote(e.target.value)} maxLength={500} placeholder="e.g. Triumph diagnostic tool"/></label></div>
    <label className={`button secondary photo-add${busy?" disabled":""}`}>{busy?<LoaderCircle className="spin"/>:<Camera/>} {busy?"Uploading…":"Add photos"}<input ref={input} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple hidden disabled={busy} onChange={e=>upload(e.target.files)}/></label>
    {error&&<p className="form-error" role="alert">{error}</p>}
    {items.length>0&&<ul className="photo-grid">{items.map(e=><li key={e.id}><Image src={photoUrl(e.path)} alt={e.note||cellName(e.level,e.service)} fill sizes="160px"/><span className="chip">{cellName(e.level,e.service)}</span>
      <div className="photo-actions"><button type="button" className="icon-btn" aria-label="Delete photo" onClick={async()=>{const r=await removeEvidence(e.id);if(r.error)setError(r.error);else setItems(x=>x.filter(i=>i.id!==e.id))}}><Trash2/></button></div></li>)}</ul>}
  </div>;
}
