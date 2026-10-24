// BikeHub field audit: the checklist the auditor fills in on their phone, and the rules that turn
// the answers into cells marked "Checked by BikeHub". Tune the rules here; each one says why.
import {BIKE_LEVELS,LEVEL_INFO,SERVICE_INFO,SERVICE_LEVELS,type BikeLevel,type ServiceLevel} from "./config";

export type ItemKind="yes"|"yes_brands"|"brands"|"number"|"text"|"choice";
export type Item={id:string;label:string;kind:ItemKind;photo?:boolean;options?:string[];hint?:string};
export type Section={id:string;title:string;items:Item[]};

/** 📷 items (`photo: true`) ask for a photo. */
export const CHECKLIST:Section[]=[
  {id:"general",title:"General",items:[
    {id:"covered_area",label:"Covered work area",kind:"yes"},
    {id:"secure_parking",label:"Secure parking for customer bikes",kind:"yes"},
    {id:"insurance",label:"Insurance for bikes on the premises",kind:"yes"},
    {id:"written_estimates",label:"Gives written estimates",kind:"yes"},
    {id:"old_parts_returned",label:"Returns old parts on request",kind:"yes"}]},
  {id:"tools",title:"Tools",items:[
    {id:"fi_scanner",label:"Fuel-injection diagnostic scanner",kind:"yes_brands",photo:true,hint:"Which brands does it read?"},
    {id:"dealer_software",label:"Brand dealer-level diagnostic software",kind:"yes_brands",photo:true,hint:"Which brands?"},
    {id:"torque_wrench",label:"Torque wrenches",kind:"yes"},
    {id:"paddock_stands",label:"Paddock / centre stands for bikes without a centre stand",kind:"yes"},
    {id:"hydraulic_lift",label:"Hydraulic lift or table",kind:"yes"}]},
  {id:"tyres",title:"Tyres",items:[
    {id:"tyre_changer_180",label:"Tyre changer for 180+ section rear tyres",kind:"yes",photo:true},
    {id:"wheel_balancer",label:"Wheel balancer",kind:"yes"}]},
  {id:"electronics",title:"Electronics",items:[
    {id:"abs_bleeding",label:"Can bleed ABS brakes",kind:"yes"},
    {id:"throttle_sync",label:"Twin-cylinder throttle-body sync tool",kind:"yes"},
    {id:"fused_relays",label:"Accessory wiring done with fused relays",kind:"yes"}]},
  {id:"major",title:"Major work",items:[
    {id:"engine_area",label:"Engine stand / clean area for engine work",kind:"yes",photo:true},
    {id:"valve_tools",label:"Valve-clearance tools (shims / buckets)",kind:"yes"},
    {id:"specialist_valve_tools",label:"Desmo or other specialist valve tools",kind:"yes_brands",hint:"Which brands?"}]},
  {id:"performance",title:"Performance",items:[
    {id:"dyno",label:"Dyno",kind:"yes",photo:true},
    {id:"remap_tools",label:"ECU remap tools",kind:"yes_brands",hint:"Which brands?"},
    {id:"suspension_service",label:"Suspension service tools, can do oil and spring work",kind:"yes"},
    {id:"fabrication",label:"Fabrication / welding",kind:"yes"}]},
  {id:"washing",title:"Washing",items:[
    {id:"wash_bay",label:"Wash bay",kind:"yes"},
    {id:"foam_wash",label:"Foam wash",kind:"yes"},
    {id:"safe_wash",label:"Low-pressure, electronics-safe washing for big bikes",kind:"yes"}]},
  {id:"specialties",title:"Specialties",items:[
    {id:"carb_2stroke",label:"Carburettor tuning and 2-stroke work (classic bikes)",kind:"yes"},
    {id:"ev_hv_safety",label:"High-voltage safety training and EV diagnostics",kind:"yes"}]},
  {id:"people",title:"People",items:[
    {id:"technicians",label:"Number of technicians",kind:"number"},
    {id:"senior_years",label:"Most experienced technician’s years",kind:"number"},
    {id:"brand_training",label:"Ex-dealer or brand training",kind:"brands",hint:"Which brands? Leave empty if none"}]},
  {id:"observed",title:"Observed on the day",items:[
    {id:"bikes_present",label:"Bike models in the workshop today",kind:"text",photo:true},
    {id:"parts_route",label:"Where parts come from",kind:"choice",options:["Dealer","Distributor","Grey import","Mixed"]}]}
];
export const ITEMS=CHECKLIST.flatMap(s=>s.items);

/** Answers: true/false for yes items, numbers, text; brand lists live under "<id>:brands". */
export type Answers=Record<string,boolean|number|string|string[]|null|undefined>;
const yes=(a:Answers,id:string)=>a[id]===true;
const brandsOf=(a:Answers,id:string)=>Array.isArray(a[`${id}:brands`])?(a[`${id}:brands`] as string[]).filter(Boolean):[];
const years=(a:Answers)=>Number(a.senior_years)||0;

type Rule={cell:[BikeLevel,ServiceLevel];needs?:string[];anyOf?:string[];brandsFrom?:string;minYears?:number;check?:(a:Answers)=>boolean;why:string};
/** Big bikes are only washed where it's done safely around electronics. */
const safeWashing=(a:Answers)=>!yes(a,"wash_bay")||yes(a,"safe_wash");
const PERF=["dyno","remap_tools","suspension_service","fabrication"];

/** Each rule marks one cell "Checked by BikeHub" when every `needs` item is yes, at least one `anyOf` item is yes,
 *  the senior technician has `minYears`, and `check` passes. With `brandsFrom`, the cell covers only the brands
 *  listed for that item (none listed = not granted). Cells with no rule (EV engine and performance work) need an override. */
export const AUTO_GRANT:Rule[]=[
  // Performance bikes
  {cell:["L1","S1"],needs:["covered_area"],why:"Routine care needs a covered work area"},
  {cell:["L1","S2"],needs:["covered_area","torque_wrench"],why:"Repairs need torque wrenches"},
  {cell:["L1","S3"],needs:["fi_scanner"],brandsFrom:"fi_scanner",why:"Fault finding needs a scanner that reads the brand"},
  {cell:["L1","S4"],needs:["engine_area","valve_tools","torque_wrench"],minYears:5,why:"Engine work needs a clean engine area, valve tools and 5+ years’ experience"},
  {cell:["L1","S5"],anyOf:PERF,minYears:3,why:"Performance work needs a dyno, remap, suspension or fabrication capability"},
  // Mid-weight & modern classics
  {cell:["L2","S1"],needs:["covered_area","paddock_stands"],why:"Many mid-weights have no centre stand"},
  {cell:["L2","S2"],needs:["covered_area","torque_wrench","paddock_stands"],why:"Repairs need torque wrenches and stands"},
  {cell:["L2","S3"],needs:["fi_scanner","abs_bleeding"],brandsFrom:"fi_scanner",why:"Electronics need a scanner for the brand and ABS bleeding"},
  {cell:["L2","S4"],needs:["engine_area","valve_tools","torque_wrench"],minYears:5,why:"Engine work needs a clean engine area, valve tools and experience"},
  {cell:["L2","S5"],needs:["fi_scanner"],anyOf:PERF,minYears:3,why:"Performance work on fuel-injected bikes needs a scanner too"},
  // Big bikes
  {cell:["L3","S1"],needs:["covered_area","paddock_stands","hydraulic_lift"],check:safeWashing,why:"Big bikes need stands, a lift and electronics-safe washing"},
  {cell:["L3","S2"],needs:["covered_area","torque_wrench","paddock_stands","hydraulic_lift","tyre_changer_180","abs_bleeding"],why:"Big-bike repairs need wide-tyre changing and ABS bleeding"},
  {cell:["L3","S3"],needs:["fi_scanner","abs_bleeding","throttle_sync"],brandsFrom:"fi_scanner",why:"Big-bike electronics need a scanner for the brand, ABS bleeding and throttle-body sync"},
  {cell:["L3","S4"],needs:["engine_area","valve_tools","torque_wrench","hydraulic_lift"],minYears:5,why:"Big-bike engine work needs a lift, valve tools and experience"},
  {cell:["L3","S5"],needs:["fi_scanner"],anyOf:["dyno","remap_tools","suspension_service"],minYears:5,why:"Big-bike performance work needs a dyno, remap or suspension capability"},
  // Superbikes & premium: dealer-level software for the brand
  {cell:["L4","S1"],needs:["covered_area","paddock_stands","hydraulic_lift","secure_parking","insurance"],check:safeWashing,why:"Superbikes need secure, insured parking and electronics-safe washing"},
  {cell:["L4","S2"],needs:["covered_area","torque_wrench","paddock_stands","hydraulic_lift","tyre_changer_180","wheel_balancer","abs_bleeding","insurance"],why:"Superbike repairs need full tyre equipment and insurance"},
  {cell:["L4","S3"],needs:["dealer_software","abs_bleeding","throttle_sync"],brandsFrom:"dealer_software",why:"Superbike electronics need the brand’s dealer-level software"},
  {cell:["L4","S4"],needs:["engine_area","valve_tools","torque_wrench","hydraulic_lift","dealer_software"],brandsFrom:"dealer_software",minYears:8,why:"Superbike engine work needs dealer software for the brand and 8+ years’ experience"},
  {cell:["L4","S5"],needs:["dealer_software"],anyOf:["dyno","remap_tools","suspension_service"],brandsFrom:"dealer_software",minYears:5,why:"Superbike performance work needs dealer software for the brand"},
  // Classic & vintage
  {cell:["CLASSIC","S1"],needs:["covered_area","carb_2stroke"],why:"Classics need carburettor know-how even for routine care"},
  {cell:["CLASSIC","S2"],needs:["covered_area","carb_2stroke","torque_wrench"],why:"Classic repairs need carburettor and 2-stroke skills"},
  {cell:["CLASSIC","S3"],needs:["carb_2stroke"],minYears:5,why:"Fault finding on classics is carburettor tuning and old-style electrics"},
  {cell:["CLASSIC","S4"],needs:["carb_2stroke","engine_area","valve_tools"],minYears:8,why:"Classic engine rebuilds need long experience"},
  {cell:["CLASSIC","S5"],needs:["carb_2stroke"],anyOf:["fabrication","dyno"],minYears:5,why:"Restoration and custom work need fabrication"},
  // Electric performance
  {cell:["EV","S1"],needs:["covered_area","ev_hv_safety"],why:"Any EV work needs high-voltage safety training"},
  {cell:["EV","S2"],needs:["ev_hv_safety","torque_wrench"],why:"EV repairs need high-voltage safety training"},
  {cell:["EV","S3"],needs:["ev_hv_safety"],why:"EV diagnostics are part of the high-voltage training item"}
];

export type GrantedCell={level:BikeLevel;service:ServiceLevel;brands:string[]};
export type Override={level:BikeLevel;service:ServiceLevel;grant:boolean;note:string};

/** Cells the answers earn. */
export function grantCells(a:Answers):GrantedCell[]{
  return AUTO_GRANT.flatMap(r=>{
    if(r.needs&&!r.needs.every(id=>yes(a,id)))return [];
    if(r.anyOf&&!r.anyOf.some(id=>yes(a,id)))return [];
    if(r.minYears&&years(a)<r.minYears)return [];
    if(r.check&&!r.check(a))return [];
    const brands=r.brandsFrom?brandsOf(a,r.brandsFrom):[];
    if(r.brandsFrom&&!brands.length)return [];
    return [{level:r.cell[0],service:r.cell[1],brands}];
  });
}
/** The auditor can add or remove any cell, always with a note. */
export function applyOverrides(granted:GrantedCell[],overrides:Override[]):GrantedCell[]{
  const out=new Map(granted.map(c=>[`${c.level}|${c.service}`,c]));
  for(const o of overrides){
    if(o.note.trim().length<5)throw new Error(`An override needs a note: ${LEVEL_INFO[o.level].name} – ${SERVICE_INFO[o.service].name}`);
    const k=`${o.level}|${o.service}`;
    if(o.grant)out.set(k,out.get(k)??{level:o.level,service:o.service,brands:[]});else out.delete(k);
  }
  return BIKE_LEVELS.flatMap(l=>SERVICE_LEVELS.flatMap(s=>out.get(`${l}|${s}`)??[]));
}
export const ruleFor=(level:BikeLevel,service:ServiceLevel)=>AUTO_GRANT.find(r=>r.cell[0]===level&&r.cell[1]===service)??null;
