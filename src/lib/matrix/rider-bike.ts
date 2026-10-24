// The rider's bike (and last city), remembered on this device only: riders have no accounts.
import {useSyncExternalStore} from "react";
import {LEVEL_SLUGS,type BikeLevel} from "./config";
import type {SizeBucket} from "@/data/bike-models";

export type RiderBike={modelId:string|null;brand:string|null;size:SizeBucket|null;level:BikeLevel|null;name:string};
const BIKE_KEY="bikehub.bike";export const CITY_KEY="bikehub.city";
const EVENT="bikehub-stored";

const read=(key:string)=>{try{return localStorage.getItem(key)}catch{return null}};
function write(key:string,value:string|null){
  try{if(value==null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch{/* private mode: the choice just isn't remembered */}
  try{window.dispatchEvent(new Event(EVENT))}catch{}
}
const subscribe=(cb:()=>void)=>{window.addEventListener(EVENT,cb);window.addEventListener("storage",cb);return ()=>{window.removeEventListener(EVENT,cb);window.removeEventListener("storage",cb)}};
/** A value saved on this device, kept in sync across components. Null while rendering on the server. */
export function useStored(key:string){return useSyncExternalStore(subscribe,()=>read(key),()=>null)}

const parseBike=(raw:string|null):RiderBike|null=>{try{const v=JSON.parse(raw||"null");return v&&typeof v.name==="string"?v as RiderBike:null}catch{return null}};
export const loadBike=()=>parseBike(read(BIKE_KEY));
export const saveBike=(b:RiderBike|null)=>write(BIKE_KEY,b?JSON.stringify(b):null);
export const saveCity=(c:string)=>write(CITY_KEY,c);
export function useRiderBike(){return parseBike(useStored(BIKE_KEY))}

/** URL parameters that describe the bike to the results page. */
export function bikeToParams(b:RiderBike|null,params:URLSearchParams){
  for(const k of ["bike","brand","size","class"])params.delete(k);
  if(!b)return params;
  if(b.modelId)params.set("bike",b.modelId);
  else{if(b.brand)params.set("brand",b.brand);if(b.size)params.set("size",b.size);else if(b.level&&!b.brand)params.set("class",LEVEL_SLUGS[b.level])}
  return params;
}
