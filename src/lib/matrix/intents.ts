// What riders ask for, in their words, mapped to a service level (and sometimes a speciality or bike row).
// Every step offers a "Not sure" choice.
import {SERVICE_INFO,type BikeLevel,type ServiceLevel,type Skill} from "./config";
import type {Fuel} from "@/data/bike-models";

export type IntentId="service"|"problem"|"tyres"|"accident"|"perform"|"trip"|"gear"|"custom";
export type Choice={id:string;label:string;hint?:string};
/** `icon` is a lucide icon name, drawn in the theme's icon tile. */
export const INTENTS:{id:IntentId;icon:string;label:string;hint:string}[]=[
  {id:"service",icon:"Wrench",label:"Service & wash",hint:"Periodic service, oil, chain, washing"},
  {id:"problem",icon:"TriangleAlert",label:"Something’s wrong",hint:"Noise, warning light, won’t start"},
  {id:"tyres",icon:"CircleDot",label:"Tyres & brakes",hint:"New tyres, punctures, brake work"},
  {id:"accident",icon:"ShieldAlert",label:"Accident repair",hint:"After a fall or crash"},
  {id:"perform",icon:"Gauge",label:"Make it perform better",hint:"Remaps, exhausts, suspension"},
  {id:"trip",icon:"Luggage",label:"Get ready for a trip",hint:"Pre-trip check and touring kit"},
  {id:"gear",icon:"HardHat",label:"Buy riding gear",hint:"Helmets, jackets, gloves"},
  {id:"custom",icon:"Sparkles",label:"Customise or restore",hint:"Custom work, classics, detailing"}
];
export const isIntent=(v:unknown):v is IntentId=>INTENTS.some(i=>i.id===v);

export const SERVICE_OPTIONS:Choice[]=[{id:"full",label:"Full service"},{id:"wash",label:"Just a wash"},{id:"oil",label:"Oil & chain"},{id:"unsure",label:"Not sure"}];
export const CUSTOM_OPTIONS:Choice[]=[{id:"fabrication",label:"Custom parts & fabrication"},{id:"restore",label:"Restore a classic bike"},{id:"detailing",label:"Detailing & paint"},{id:"unsure",label:"Not sure"}];
export const RIDE_OPTIONS:Choice[]=[{id:"yes",label:"Yes, I can ride it"},{id:"no",label:"No, it needs picking up"},{id:"unsure",label:"Not sure"}];
export const SYMPTOMS:Choice[]=[
  {id:"noise",label:"Strange noise"},{id:"wont_start",label:"Won’t start"},{id:"warning_light",label:"Warning light on"},{id:"brakes",label:"Brakes feel off"},
  {id:"oil_leak",label:"Leaking oil"},{id:"wobble",label:"Pulling or wobbling"},{id:"fall",label:"After a fall"},{id:"unsure",label:"Not sure"}
];

/** What the rider chose, as kept in the results URL. */
export type Need={intent:IntentId;option?:string|null;symptom?:string|null;ride?:string|null;service?:ServiceLevel|null};
/** What that need means for matching. */
export type Resolved={service:ServiceLevel;skill?:Skill;level?:BikeLevel;preferRating?:boolean;summary:string;touringKit?:boolean};

/** Symptom → service level. "Won't start" depends on the fuel system; "after a fall" on whether the bike can be ridden. */
export function symptomService(symptom:string|null|undefined,fuel:Fuel|null,ride?:string|null):ServiceLevel{
  switch(symptom){
    case "warning_light":return "S3";
    case "wont_start":return fuel==="carb"?"S2":"S3";
    case "fall":return ride==="no"?"S4":"S2";
    default:return "S2"; // noise, brakes, oil leak (may escalate to S4 once inspected), wobble, not sure
  }
}

const label=(list:Choice[],id?:string|null)=>list.find(c=>c.id===id)?.label;

/** Turns a need into a service level and extras. `fuel` and `level` come from the rider's bike when known. */
export function resolveNeed(n:Need,bike:{fuel:Fuel|null;level:BikeLevel|null}={fuel:null,level:null}):Resolved|null{
  const r=resolveIntent(n,bike);
  // A search phrase such as "engine work" can name the depth of job directly.
  return r&&n.service?{...r,service:n.service,preferRating:false,summary:SERVICE_INFO[n.service].line}:r;
}
function resolveIntent(n:Need,bike:{fuel:Fuel|null;level:BikeLevel|null}):Resolved|null{
  const fuel=bike.fuel??(bike.level==="CLASSIC"?"carb":bike.level?"fi":null);
  switch(n.intent){
    case "service":return n.option==="wash"?{service:"S1",skill:"washing_detailing",summary:"Wash"}:{service:"S1",summary:n.option==="oil"?"Oil & chain care":"Routine service"};
    case "problem":{
      const service=symptomService(n.symptom,fuel,n.ride);
      return {service,skill:n.symptom==="brakes"?"brakes":n.symptom==="warning_light"||n.symptom==="wont_start"&&service==="S3"?"electrical":undefined,preferRating:!n.symptom||n.symptom==="unsure",summary:label(SYMPTOMS,n.symptom)||"Something’s wrong"};
    }
    case "tyres":return {service:"S2",skill:"tyres",summary:"Tyres & brakes"};
    case "accident":return {service:n.ride==="no"?"S4":"S2",skill:"paint",summary:n.ride==="no"?"Major accident repair":"Accident repair"};
    case "perform":return {service:"S5",summary:"Performance upgrades"};
    case "trip":return {service:"S1",skill:"touring_kit",touringKit:true,summary:"Pre-trip check"};
    case "custom":
      if(n.option==="restore")return {service:"S4",level:"CLASSIC",summary:"Classic restoration"};
      if(n.option==="detailing")return {service:"S1",skill:"washing_detailing",summary:"Detailing & paint"};
      return {service:"S5",skill:"fabrication",summary:"Custom work"};
    case "gear":return null; // riding gear shops sit outside the matrix
  }
}

/** Steps after choosing a tile, before the bike picker. */
export const intentStep=(intent:IntentId):"option"|"symptom"|"ride"|null=>intent==="service"||intent==="custom"?"option":intent==="problem"?"symptom":intent==="accident"?"ride":null;
export const optionsFor=(intent:IntentId)=>intent==="custom"?CUSTOM_OPTIONS:SERVICE_OPTIONS;
