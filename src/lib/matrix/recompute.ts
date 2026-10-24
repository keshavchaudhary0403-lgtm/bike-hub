// Review-driven status changes for a capability cell. Server-side helper for staff actions (not an action itself).
import type {requireStaff} from "@/lib/admin";
import {isStatus} from "./config";
import {evaluateCell} from "./proven";

export type Staff=Awaited<ReturnType<typeof requireStaff>>["supabase"];

/** Re-checks one cell against its approved reviews: visited → proven after 3, back down on poor ratings.
 *  Every change is logged by the database (capability_log); downgrades show as alerts on the Audits page. */
export async function recomputeCell(supabase:Staff,shopId:string,level:string,service:string){
  const {data:cell}=await supabase.from("shop_capabilities").select("status").eq("shop_id",shopId).eq("bike_level",level).eq("service_level",service).maybeSingle();
  if(!cell||!isStatus(cell.status))return null;
  const {data:revs}=await supabase.from("reviews").select("overall_rating").eq("centre_id",shopId).eq("bike_level",level).eq("service_level",service).eq("status","published");
  const ratings=(revs||[]).map(r=>r.overall_rating as number);
  const {status,change}=evaluateCell(cell.status,ratings);
  if(!change)return null;
  const avg=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):"–";
  const note=change==="upgraded"?`Proven: ${ratings.length} approved rider reviews`:change==="downgraded"?`Downgraded: ${ratings.length} reviews averaging ${avg}. Needs a re-visit.`:`Back to checked: fewer than 3 approved reviews`;
  await supabase.from("shop_capabilities").update({status,source:"reports",note}).eq("shop_id",shopId).eq("bike_level",level).eq("service_level",service);
  return change;
}

