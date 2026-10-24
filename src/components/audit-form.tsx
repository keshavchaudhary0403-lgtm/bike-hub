"use client";
// Field audit on the auditor's phone. Big yes/no buttons, photos straight from the camera,
// and a draft saved on the phone after every change so a dropped connection loses nothing.
import Image from "next/image";import {useRef,useState} from "react";import {useRouter} from "next/navigation";
import {Camera,Check,LoaderCircle,Save,Trash2,X} from "lucide-react";
import {CHECKLIST,applyOverrides,grantCells,ruleFor,type Answers,type Item,type Override} from "@/lib/matrix/audit";
import {BIKE_LEVELS,LEVEL_INFO,SERVICE_INFO,SERVICE_LEVELS,cellLabel,type BikeLevel,type ServiceLevel} from "@/lib/matrix/config";
import {useStored} from "@/lib/matrix/rider-bike";
import {saveAudit} from "@/app/admin/matrix-actions";
import {createClient} from "@/lib/supabase-browser";import {photoUrl} from "@/lib/listings";import {shrink} from "@/components/photo-manager";

type Draft={answers:Answers;photos:Record<string,string[]>;overrides:Override[];notes:string;visitedAt:string;savedAt:string};
const today=()=>new Date().toISOString().slice(0,10);
const empty=():Draft=>({answers:{},photos:{},overrides:[],notes:"",visitedAt:today(),savedAt:""});
const k=(l:string,s:string)=>`${l}|${s}`;

export function AuditForm({shop,current}:{shop:{id:string;name:string;city:string};current:{level:BikeLevel;service:ServiceLevel;status:string}[]}){
  const router=useRouter();const draftKey=`bikehub.audit.${shop.id}`;
  const stored=useStored(draftKey);
  const [draft,setDraft]=useState<Draft|null>(null);
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const d=draft??empty();
  function update(fn:(x:Draft)=>Draft){
    const next={...fn(d),savedAt:new Date().toISOString()};setDraft(next);
    try{localStorage.setItem(draftKey,JSON.stringify(next))}catch{/* storage full or blocked: the form still works */}
  }
  const setAnswer=(id:string,v:Answers[string])=>update(x=>({...x,answers:{...x.answers,[id]:v}}));
  let saved:Draft|null=null;try{saved=stored?JSON.parse(stored):null}catch{}

  const granted=grantCells(d.answers);const grantedSet=new Set(granted.map(c=>k(c.level,c.service)));
  let final:ReturnType<typeof applyOverrides>|null=null;let overrideProblem="";
  try{final=applyOverrides(granted,d.overrides)}catch(e){overrideProblem=e instanceof Error?e.message:"Add a note to every change."}
  const finalSet=new Set((final||[]).map(c=>k(c.level,c.service)));
  const overrideFor=(l:string,s:string)=>d.overrides.find(o=>o.level===l&&o.service===s);
  function toggleCell(l:BikeLevel,s:ServiceLevel){
    const auto=grantedSet.has(k(l,s));const existing=overrideFor(l,s);
    update(x=>({...x,overrides:existing?x.overrides.filter(o=>o!==existing):[...x.overrides,{level:l,service:s,grant:!auto,note:""}]}));
  }
  async function submit(){
    if(overrideProblem){setError(overrideProblem);return}
    setBusy(true);setError("");
    const r=await saveAudit({shopId:shop.id,visitedAt:d.visitedAt,answers:d.answers,photos:d.photos,overrides:d.overrides,notes:d.notes});
    setBusy(false);
    if(r.error){setError(r.error);return}
    try{localStorage.removeItem(draftKey)}catch{}
    router.push(`/admin/audits?saved=1`);
  }

  if(!draft&&saved?.savedAt)return <div className="dash-card"><h2>Unsent draft found</h2><p className="hint">You started this audit on {new Date(saved.savedAt).toLocaleString("en-IN")}.</p>
    <div className="dash-actions"><button type="button" className="button" onClick={()=>setDraft(saved)}>Continue the draft</button><button type="button" className="button secondary" onClick={()=>{try{localStorage.removeItem(draftKey)}catch{};setDraft(empty())}}>Start again</button></div></div>;

  return <div className="audit">
    <div className="dash-card audit-meta"><label className="field-label">Visit date<input className="field" type="date" value={d.visitedAt} onChange={e=>update(x=>({...x,visitedAt:e.target.value}))}/></label>
      {d.savedAt&&<p className="hint">Draft saved on this phone at {new Date(d.savedAt).toLocaleTimeString("en-IN")}.</p>}</div>
    {CHECKLIST.map(section=><fieldset className="dash-card audit-section" key={section.id}><legend>{section.title}</legend>
      {section.items.map(item=><AuditItem key={item.id} item={item} answers={d.answers} setAnswer={setAnswer} photos={d.photos[item.id]||[]} shopId={shop.id}
        setPhotos={p=>update(x=>({...x,photos:{...x.photos,[item.id]:p}}))}/>)}
    </fieldset>)}
    <div className="dash-card"><h2>Result</h2>
      <p className="hint">Tap a cell to change it. Green cells will be marked “Checked by BikeHub”. Any change from the automatic result needs a note.</p>
      <div className="cap-scroll" role="region" aria-label="Audit result" tabIndex={0}><table className="cap-grid editor-grid audit-grid">
        <thead><tr><th scope="col">Kind of bike</th>{SERVICE_LEVELS.map(s=><th scope="col" key={s}>{SERVICE_INFO[s].name}</th>)}</tr></thead>
        <tbody>{BIKE_LEVELS.map(l=><tr key={l}><th scope="row"><b>{LEVEL_INFO[l].name}</b></th>{SERVICE_LEVELS.map(s=>{const on=finalSet.has(k(l,s));const o=overrideFor(l,s);const was=current.find(c=>c.level===l&&c.service===s);
          return <td key={s} className={on?"granted":undefined}><button type="button" className="cell-btn" aria-pressed={on} aria-label={`${cellLabel(l,s)}: ${on?"checked":"not checked"}${o?", changed by hand":""}`} onClick={()=>toggleCell(l,s)} title={ruleFor(l,s)?.why||"No automatic rule: needs a note"}>{on?<Check size={16}/>:<X size={14}/>}</button>
            {o&&<small className="needs-visit">changed</small>}{was&&was.status!=="claimed"&&!on&&<small>was {was.status}</small>}</td>})}</tr>)}</tbody></table></div>
      {d.overrides.map((o,i)=><label key={k(o.level,o.service)} className="field-label override">{o.grant?"Adding":"Removing"} {cellLabel(o.level,o.service)}: why?<input className="field" value={o.note} required minLength={5} maxLength={500} onChange={e=>update(x=>({...x,overrides:x.overrides.map((y,j)=>j===i?{...y,note:e.target.value}:y)}))} placeholder="What you saw"/></label>)}
      <label className="field-label">Notes for the team <span className="optional">(optional)</span><textarea value={d.notes} onChange={e=>update(x=>({...x,notes:e.target.value}))} maxLength={3000}/></label>
      {(error||overrideProblem)&&<p className="form-error" role="alert">{error||overrideProblem}</p>}
      <button type="button" className="button audit-submit" onClick={submit} disabled={busy}>{busy?<LoaderCircle className="spin"/>:<Save/>} Save audit for {shop.name}</button>
    </div>
  </div>;
}

function AuditItem({item,answers,setAnswer,photos,setPhotos,shopId}:{item:Item;answers:Answers;setAnswer:(id:string,v:Answers[string])=>void;photos:string[];setPhotos:(p:string[])=>void;shopId:string}){
  const v=answers[item.id];const brandKey=`${item.id}:brands`;
  const [brandText,setBrandText]=useState(Array.isArray(answers[brandKey])?(answers[brandKey] as string[]).join(", "):"");
  const yesNo=<div className="yesno" role="group" aria-label={item.label}><button type="button" aria-pressed={v===true} className={v===true?"on yes":undefined} onClick={()=>setAnswer(item.id,v===true?null:true)}>Yes</button><button type="button" aria-pressed={v===false} className={v===false?"on no":undefined} onClick={()=>setAnswer(item.id,v===false?null:false)}>No</button></div>;
  const brands=<input className="field" value={brandText} onChange={e=>{setBrandText(e.target.value);setAnswer(brandKey,e.target.value.split(",").map(x=>x.trim()).filter(Boolean))}} placeholder={item.hint||"Brands, comma separated"} aria-label={`${item.label}: brands`}/>;
  return <div className="audit-item"><p className="audit-label">{item.label}{item.photo&&<span aria-label="photo wanted"> 📷</span>}</p>
    {item.kind==="yes"&&yesNo}
    {item.kind==="yes_brands"&&<>{yesNo}{v===true&&brands}</>}
    {item.kind==="brands"&&brands}
    {item.kind==="number"&&<input className="field" type="number" inputMode="numeric" min={0} max={200} value={typeof v==="number"?v:""} onChange={e=>setAnswer(item.id,e.target.value===""?null:Number(e.target.value))} aria-label={item.label}/>}
    {item.kind==="text"&&<input className="field" value={typeof v==="string"?v:""} onChange={e=>setAnswer(item.id,e.target.value.slice(0,300))} aria-label={item.label} placeholder="e.g. 2 Trident 660, 1 Duke 390"/>}
    {item.kind==="choice"&&<div className="yesno wrap" role="group" aria-label={item.label}>{item.options!.map(o=><button type="button" key={o} aria-pressed={v===o} className={v===o?"on yes":undefined} onClick={()=>setAnswer(item.id,v===o?null:o)}>{o}</button>)}</div>}
    {item.photo&&<AuditPhotos shopId={shopId} photos={photos} setPhotos={setPhotos} label={item.label}/>}
  </div>;
}

function AuditPhotos({shopId,photos,setPhotos,label}:{shopId:string;photos:string[];setPhotos:(p:string[])=>void;label:string}){
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const input=useRef<HTMLInputElement>(null);
  async function add(files:FileList|null){
    if(!files?.length)return;setBusy(true);setError("");const supabase=createClient();const added:string[]=[];
    try{for(const f of [...files].slice(0,4)){let blob:Blob;try{blob=await shrink(f)}catch{setError("That photo couldn’t be read.");continue}
      const path=`${shopId}/audit/${crypto.randomUUID()}.jpg`;const {error:up}=await supabase.storage.from("listing-photos").upload(path,blob,{contentType:"image/jpeg"});
      if(up){setError(`Upload failed: ${up.message}. The draft is kept; try again with signal.`);continue}added.push(path)}
      if(added.length)setPhotos([...photos,...added]);
    }finally{setBusy(false);if(input.current)input.current.value=""}
  }
  return <div className="audit-photos">{photos.map(p=><span key={p} className="thumb"><Image src={photoUrl(p)} alt={label} fill sizes="80px"/><button type="button" aria-label="Remove photo" onClick={()=>setPhotos(photos.filter(x=>x!==p))}><Trash2 size={14}/></button></span>)}
    <label className={`button secondary small${busy?" disabled":""}`}>{busy?<LoaderCircle className="spin"/>:<Camera/>} Photo<input ref={input} type="file" accept="image/*" capture="environment" hidden disabled={busy} onChange={e=>add(e.target.files)}/></label>
    {error&&<p className="form-error" role="alert">{error}</p>}</div>;
}
