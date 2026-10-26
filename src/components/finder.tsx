"use client";
// "What does your bike need?" → (details) → "Which bike do you ride?" → (warranty) → location → results.
// Every step has a "Not sure" way forward, and the rider's bike is remembered on this device.
import Link from "next/link";import {useEffect,useMemo,useRef,useState} from "react";import {useRouter} from "next/navigation";
import {ArrowLeft,ArrowRight,Bike,CircleDot,CircleHelp,Cog,Disc,Droplet,Droplets,Gauge,Hammer,HardHat,History,LocateFixed,LoaderCircle,Luggage,MapPin,Power,Search,ShieldAlert,ShieldCheck,ShieldOff,Sparkles,TriangleAlert,Truck,Volume2,Waves,Wrench} from "lucide-react";
const TILE_ICONS:Record<string,typeof Wrench>={Wrench,TriangleAlert,CircleDot,ShieldAlert,Gauge,Luggage,HardHat,Sparkles,CircleHelp,Cog,Disc,Droplet,Droplets,Hammer,History,Power,ShieldCheck,ShieldOff,Truck,Volume2,Waves,Bike};
import {BIKE_BRANDS,BIKE_MODELS,SIZE_BUCKETS,bikeModel,bikeName,levelForSize,normalize,type BikeModel,type SizeBucket} from "@/data/bike-models";
import {CUSTOM_OPTIONS,INTENTS,RIDE_OPTIONS,SERVICE_OPTIONS,SYMPTOMS,intentStep,isIntent,type Choice,type IntentId} from "@/lib/matrix/intents";
import {CITY_KEY,bikeToParams,saveBike,saveCity,useRiderBike,useStored,type RiderBike} from "@/lib/matrix/rider-bike";
import {CITIES,REGION,isLiveCity,nearestCity} from "@/lib/listings";

type Step="intent"|"option"|"symptom"|"ride"|"bike"|"warranty"|"location";
export type FinderStart={need?:string;opt?:string;sym?:string;ride?:string;step?:string;next?:string};

/** Big, keyboard-friendly choice tiles in the theme's icon-tile style. */
function Choices({items,onPick,selected}:{items:Choice[];onPick:(id:string)=>void;selected?:string|null}){
  return <div className="choice-grid" role="list">{items.map(c=>{const Icon=c.icon?TILE_ICONS[c.icon]:null;
    return <button type="button" role="listitem" key={c.id} className={`choice${c.id==="unsure"?" unsure":""}${selected===c.id?" on":""}`} onClick={()=>onPick(c.id)}>{Icon&&<span className="tile-icon" aria-hidden="true"><Icon/></span>}<span className="tile-text"><b>{c.label}</b>{c.hint&&<small>{c.hint}</small>}</span></button>})}</div>;
}

export function IntentTiles({onPick,linkBase}:{onPick?:(id:IntentId)=>void;linkBase?:string}){
  return <nav className="intent-tiles" aria-label="What does your bike need?">{INTENTS.map(t=>{
    const Icon=TILE_ICONS[t.icon]||Wrench;
    const body=<><span className="tile-icon" aria-hidden="true"><Icon/></span><span className="tile-text"><b>{t.label}</b><small>{t.hint}</small></span></>;
    const href=t.id==="gear"?"/services?type=gear_shop":`${linkBase||"/find"}?need=${t.id}`;
    return onPick&&t.id!=="gear"?<button type="button" key={t.id} className="intent-tile" onClick={()=>onPick(t.id)}>{body}</button>:<Link key={t.id} className="intent-tile" href={href}>{body}</Link>;
  })}</nav>;
}

/** Brand → model with type-ahead, or brand + rough size when the rider doesn't know the model. */
export function BikePicker({onDone}:{onDone:(b:RiderBike|null)=>void}){
  const [query,setQuery]=useState("");const [brand,setBrand]=useState<string|null>(null);const [unknown,setUnknown]=useState(false);
  const results=useMemo(()=>{
    const q=normalize(query);const list=BIKE_MODELS.filter(m=>(!brand||m.brand===brand)&&(!q||normalize(`${m.brand} ${m.model}`).includes(q)||m.aliases.some(a=>a.includes(q))));
    return list.sort((a,b)=>Number(b.current)-Number(a.current)).slice(0,8);
  },[query,brand]);
  const pickModel=(m:BikeModel)=>onDone({modelId:m.id,brand:m.brand,size:null,level:m.level,name:bikeName(m)});
  const pickSize=(size:SizeBucket)=>brand&&onDone({modelId:null,brand,size,level:levelForSize(brand,size),name:`${brand} (${SIZE_BUCKETS.find(s=>s.id===size)!.label.toLowerCase()})`});
  if(unknown)return <div className="bike-picker">
    <p className="finder-sub">No problem. Pick the brand and roughly how big it is.</p>
    <label className="field-label">Brand<select className="field" value={brand||""} onChange={e=>setBrand(e.target.value||null)}><option value="">Choose brand</option>{BIKE_BRANDS.map(b=><option key={b}>{b}</option>)}</select></label>
    {brand&&<><p className="finder-sub">How big is it?</p><Choices items={SIZE_BUCKETS.map(s=>({id:s.id,label:s.label,icon:s.id==="electric"?"Power":s.id==="old"?"History":"Gauge"}))} onPick={id=>pickSize(id as SizeBucket)}/></>}
    <div className="finder-links"><button type="button" className="link" onClick={()=>setUnknown(false)}>Back to model list</button><button type="button" className="link" onClick={()=>brand&&onDone({modelId:null,brand,size:null,level:null,name:brand})} disabled={!brand}>Not sure of the size, just use the brand</button></div>
  </div>;
  return <div className="bike-picker">
    <label className="field search-field"><Search aria-hidden="true"/><span className="sr-only">Search your bike</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Type your bike, e.g. Duke 390 or Classic 350" autoComplete="off"/></label>
    <div className="brand-chips" role="group" aria-label="Filter by brand"><button type="button" className={!brand?"on":undefined} aria-pressed={!brand} onClick={()=>setBrand(null)}>All brands</button>{BIKE_BRANDS.filter(b=>BIKE_MODELS.some(m=>m.brand===b&&m.current)).map(b=><button type="button" key={b} className={brand===b?"on":undefined} aria-pressed={brand===b} onClick={()=>setBrand(brand===b?null:b)}>{b}</button>)}</div>
    {(query||brand)?<ul className="model-list" aria-live="polite">{results.length?results.map(m=><li key={m.id}><button type="button" onClick={()=>pickModel(m)}><span className="tile-icon" aria-hidden="true"><Bike/></span><span className="tile-text"><b>{m.model}</b><small>{m.brand}{!m.current?` · ${m.years||"older model"}`:""}</small></span></button></li>):<li className="muted">No match. Try fewer letters, or choose “I don’t know my model”.</li>}</ul>
      :<p className="finder-sub">Start typing, or tap your bike’s brand.</p>}
    <div className="finder-links"><button type="button" className="link" onClick={()=>setUnknown(true)}>I don’t know my model</button></div>
  </div>;
}

export function Finder({start}:{start:FinderStart}){
  const router=useRouter();const heading=useRef<HTMLHeadingElement>(null);
  const changeOnly=start.step==="bike"&&!!start.next;
  const [intent,setIntent]=useState<IntentId|null>(isIntent(start.need)?start.need:null);
  const [opt,setOpt]=useState<string|null>(start.opt||null);const [sym,setSym]=useState<string|null>(start.sym||null);const [ride,setRide]=useState<string|null>(start.ride||null);
  const first:Step=changeOnly?"bike":intent?(intentStep(intent)??"bike"):"intent";
  const [history,setHistory]=useState<Step[]>([first]);const step=history[history.length-1];
  const [bike,setBike]=useState<RiderBike|null>(null);const remembered=useRiderBike();const [picking,setPicking]=useState(false);
  const [warranty,setWarranty]=useState<string|null>(null);
  const storedCity=useStored(CITY_KEY);const [cityPick,setCity]=useState<string|null>(null);const city=cityPick??(storedCity&&CITIES.includes(storedCity)?storedCity:"");const [area,setArea]=useState("");const [locating,setLocating]=useState(false);const [locError,setLocError]=useState("");
  useEffect(()=>{heading.current?.focus()},[step]);
  const go=(s:Step)=>setHistory(h=>[...h,s]);const back=()=>history.length>1?setHistory(h=>h.slice(0,-1)):router.back();

  const afterBike=(b:RiderBike|null)=>{
    setBike(b);if(b)saveBike(b);setPicking(false);
    const m=bikeModel(b?.modelId);
    if(m?.current&&m.level!=="CLASSIC")go("warranty");else finishOrLocate(b,null);
  };
  /** The bike is optional: skipping searches every kind of bike, and keeps any bike remembered on this phone. */
  const skipBike=()=>{setBike(null);setPicking(false);finishOrLocate(null,null)};
  function finishOrLocate(b:RiderBike|null,w:string|null){
    if(changeOnly){
      const url=new URL(start.next!,window.location.origin);if(url.origin!==window.location.origin||!url.pathname.startsWith("/services"))return router.push("/services");
      bikeToParams(b,url.searchParams);if(w==="yes")url.searchParams.set("warranty","1");else url.searchParams.delete("warranty");
      return router.push(url.pathname+url.search);
    }
    go("location");
  }
  function results(loc:{lat?:number;lng?:number;city?:string;area?:string}){
    const p=new URLSearchParams();if(intent)p.set("need",intent);
    if(opt)p.set("opt",opt);if(sym)p.set("sym",sym);if(ride)p.set("ride",ride);
    bikeToParams(bike,p);if(warranty==="yes")p.set("warranty","1");
    if(loc.lat!=null&&loc.lng!=null){p.set("lat",loc.lat.toFixed(3));p.set("lng",loc.lng.toFixed(3))}
    if(loc.city){p.set("location",loc.city);saveCity(loc.city)}
    if(loc.area)p.set("area",loc.area);
    router.push(`/services?${p}`);
  }
  function locate(){
    setLocError("");if(!("geolocation" in navigator)){setLocError("Your browser can’t share location. Choose your city instead.");return}
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos=>{const o={lat:pos.coords.latitude,lng:pos.coords.longitude};const near=nearestCity(o);
      if(!isLiveCity(near)){setLocating(false);setLocError("Coming soon to your city.");return}
      results({...o,city:near!})},
      ()=>{setLocating(false);setLocError("We couldn’t get your location. Choose your city instead.")},{timeout:10000,maximumAge:600000});
  }

  // Steps shown to the rider: the tile (unless they arrived from one), its follow-up question if any, bike, location.
  const total=changeOnly?1:(first==="intent"?1:0)+(intent&&intentStep(intent)?1:0)+2;
  // Warranty, and "Can you ride it?" after the "After a fall" symptom, are sub-questions that don't count as steps.
  const index=changeOnly?1:Math.min(history.filter(s=>s!=="warranty"&&!(s==="ride"&&history.includes("symptom"))).length,total);
  const title:Record<Step,string>={intent:"What does your bike need?",option:intent==="custom"?"What would you like done?":"What kind of service?",symptom:"What’s happening?",ride:"Can you ride it?",bike:"Which bike do you ride?",warranty:"Is it still under warranty?",location:"Where are you?"};
  // What the rider has told us so far, shown above the question so they keep their place.
  const picked=[INTENTS.find(i=>i.id===intent)?.label,[...SERVICE_OPTIONS,...CUSTOM_OPTIONS].find(o=>o.id===opt)?.label,SYMPTOMS.find(o=>o.id===sym)?.label,ride?RIDE_OPTIONS.find(o=>o.id===ride)?.label:null,step==="warranty"||step==="location"?bike?.name:null].filter((x):x is string=>!!x&&x!=="Not sure");
  return <section className="finder" aria-labelledby="finder-title">
    <div className="finder-top">{(history.length>1||step!=="intent")?<button type="button" className="link back" onClick={back}><ArrowLeft/> Back</button>:<span/>}
      <div className="finder-progress" aria-label={`Step ${index} of ${total}`}><span>Step {index} of {total}</span><span className="bar" aria-hidden="true">{Array.from({length:total},(_,i)=><i key={i} className={i<index?"on":undefined}/>)}</span></div></div>
    {picked.length>0&&<p className="finder-picked">{picked.map(x=><span key={x} className="chip">{x}</span>)}</p>}
    <h2 id="finder-title" ref={heading} tabIndex={-1}>{title[step]}</h2>
    {step==="intent"&&<IntentTiles onPick={id=>{setIntent(id);setOpt(null);setSym(null);setRide(null);go(intentStep(id)??"bike")}}/>}
    {step==="option"&&<Choices items={intent==="custom"?CUSTOM_OPTIONS:SERVICE_OPTIONS} selected={opt} onPick={id=>{setOpt(id==="unsure"?null:id);go("bike")}}/>}
    {step==="symptom"&&<Choices items={SYMPTOMS} selected={sym} onPick={id=>{setSym(id);go(id==="fall"?"ride":"bike")}}/>}
    {step==="ride"&&<Choices items={RIDE_OPTIONS} selected={ride} onPick={id=>{setRide(id);go("bike")}}/>}
    {step==="bike"&&<div className="finder-skip"><p className="finder-sub">Optional. It helps us show shops that can handle your bike.</p><button type="button" className="button secondary small" onClick={skipBike}>Skip, show shops for any bike <ArrowRight/></button></div>}
    {step==="bike"&&(remembered&&!picking?<div className="bike-remembered"><p className="choice on"><span className="tile-icon" aria-hidden="true"><Bike/></span><span className="tile-text"><small>Your bike</small><b>{remembered.name}</b></span></p><div className="finder-actions"><button type="button" className="button" onClick={()=>afterBike(remembered)}>Yes, that’s my bike <ArrowRight/></button><button type="button" className="button secondary" onClick={()=>setPicking(true)}>Change bike</button></div></div>
      :<BikePicker onDone={afterBike}/>)}
    {step==="warranty"&&<><p className="finder-sub">Bikes under warranty are usually best serviced at an official service centre, so we show those first.</p><Choices items={[{id:"yes",label:"Yes, under warranty",icon:"ShieldCheck"},{id:"no",label:"No",icon:"ShieldOff"},{id:"unsure",label:"Not sure",icon:"CircleHelp"}]} selected={warranty} onPick={id=>{setWarranty(id);finishOrLocate(bike,id)}}/></>}
    {step==="location"&&<div className="finder-location">
      <button type="button" className="choice locate" onClick={locate} disabled={locating}><span className="tile-icon" aria-hidden="true">{locating?<LoaderCircle className="spin"/>:<LocateFixed/>}</span><span className="tile-text"><b>{locating?"Finding you…":"Use my location"}</b><small>Nearest shops first</small></span></button>
      <form className="choice city-form" onSubmit={e=>{e.preventDefault();results({city:city||undefined,area:area.trim()||undefined})}}>
        <span className="tile-icon" aria-hidden="true"><MapPin/></span>
        <div className="city-fields"><label className="field-label">City<select className="field" value={city} onChange={e=>setCity(e.target.value)}><option value="">All of {REGION}</option>{CITIES.map(c=><option key={c}>{c}</option>)}</select></label>
          <label className="field-label"><span>Area <span className="optional">(optional)</span></span><input className="field" value={area} onChange={e=>setArea(e.target.value)} maxLength={60} placeholder="e.g. Sector 62"/></label>
          <button className="button">Show shops <ArrowRight/></button></div>
      </form>
      {locError&&<p className="form-error" role="alert">{locError}</p>}</div>}
  </section>;
}
