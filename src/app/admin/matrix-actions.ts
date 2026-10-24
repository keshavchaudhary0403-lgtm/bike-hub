"use server";
// Field audits and review-driven status changes for capability cells. Staff only.
import {revalidatePath} from "next/cache";import {requireStaff} from "@/lib/admin";
import {applyOverrides,grantCells,ITEMS,type Answers,type Override} from "@/lib/matrix/audit";
import {isBikeLevel,isServiceLevel,isStatus} from "@/lib/matrix/config";
import {recomputeCell} from "@/lib/matrix/recompute";

export type AuditInput={shopId:string;visitedAt:string;answers:Answers;photos:Record<string,string[]>;overrides:Override[];notes:string};

export async function saveAudit(input:AuditInput):Promise<{error?:string}>{
  const {supabase,user,profile}=await requireStaff();
  const shopId=String(input.shopId||"");if(!/^[0-9a-f-]{36}$/i.test(shopId))return {error:"Unknown listing."};
  const {data:shop}=await supabase.from("service_centres").select("id,slug").eq("id",shopId).maybeSingle();if(!shop)return {error:"Listing not found."};
  // Keep only known checklist answers.
  const known=new Set(ITEMS.flatMap(i=>[i.id,`${i.id}:brands`]));
  const answers=Object.fromEntries(Object.entries(input.answers||{}).filter(([k])=>known.has(k))) as Answers;
  const overrides=(input.overrides||[]).filter(o=>isBikeLevel(o.level)&&isServiceLevel(o.service)).map(o=>({...o,note:String(o.note||"").slice(0,500)}));
  let cells;try{cells=applyOverrides(grantCells(answers),overrides)}catch(e){return {error:e instanceof Error?e.message:"Every change needs a note."}}
  const photos=Object.fromEntries(Object.entries(input.photos||{}).map(([k,v])=>[k,(Array.isArray(v)?v:[]).filter(p=>typeof p==="string"&&p.startsWith(`${shopId}/audit/`)&&!p.includes("..")).slice(0,10)]));
  const visitedAt=/^\d{4}-\d{2}-\d{2}$/.test(input.visitedAt)?input.visitedAt:new Date().toISOString().slice(0,10);

  const {error:auditError}=await supabase.from("shop_audits").insert({shop_id:shopId,auditor:user.id,auditor_name:profile?.display_name||user.email||null,visited_at:visitedAt,answers,photos,result_cells:cells,overrides,notes:String(input.notes||"").slice(0,3000)||null});
  if(auditError)return {error:`Could not save the audit: ${auditError.message}`};

  const {data:existing}=await supabase.from("shop_capabilities").select("bike_level,service_level,status").eq("shop_id",shopId);
  const key=(l:string,s:string)=>`${l}|${s}`;const current=new Map((existing||[]).map(c=>[key(c.bike_level,c.service_level),c.status]));
  const overrideNote=(l:string,s:string)=>overrides.find(o=>o.level===l&&o.service===s)?.note;
  // Granted cells become "Checked by BikeHub" (proven ones stay proven); checked cells not confirmed today go back to claims.
  const rows=cells.map(c=>({shop_id:shopId,bike_level:c.level,service_level:c.service,brands:c.brands,status:current.get(key(c.level,c.service))==="proven"?"proven":"visited",source:"audit",note:overrideNote(c.level,c.service)?`Audit ${visitedAt} (override: ${overrideNote(c.level,c.service)})`:`Audit ${visitedAt}`}));
  if(rows.length){const {error}=await supabase.from("shop_capabilities").upsert(rows,{onConflict:"shop_id,bike_level,service_level"});if(error)return {error:`Audit saved, but the cells could not be updated: ${error.message}`}}
  const granted=new Set(cells.map(c=>key(c.level,c.service)));
  for(const c of existing||[])if(c.status!=="claimed"&&!granted.has(key(c.bike_level,c.service_level)))
    await supabase.from("shop_capabilities").update({status:"claimed",source:"audit",note:overrideNote(c.bike_level,c.service_level)?`Removed at audit ${visitedAt}: ${overrideNote(c.bike_level,c.service_level)}`:`Not confirmed at audit ${visitedAt}`}).eq("shop_id",shopId).eq("bike_level",c.bike_level).eq("service_level",c.service_level);

  // Photos become evidence; open visit requests are done; cells with enough reviews become proven straight away.
  const labels=new Map(ITEMS.map(i=>[i.id,i.label]));
  const evidence=Object.entries(photos).flatMap(([item,paths])=>paths.map(p=>({shop_id:shopId,type:"audit_item",url_or_ref:p,note:`${labels.get(item)||item} (audit ${visitedAt})`})));
  if(evidence.length)await supabase.from("capability_evidence").insert(evidence);
  await supabase.from("audit_requests").update({status:"done"}).eq("shop_id",shopId).in("status",["new","scheduled"]);
  for(const c of cells)await recomputeCell(supabase,shopId,c.level,c.service);
  revalidatePath(`/services/${shop.slug}`);revalidatePath("/services");revalidatePath("/admin","layout");revalidatePath("/partner/dashboard");
  return {};
}

export async function setRequestStatus(form:FormData){
  const {supabase}=await requireStaff();const status=String(form.get("status"));
  if(!["new","scheduled","done","declined"].includes(status))return;
  await supabase.from("audit_requests").update({status}).eq("id",String(form.get("id")));
  revalidatePath("/admin","layout");revalidatePath("/partner/dashboard");
}

export type AdminCell={level:string;service:string;status:string|null;brands:string[]};
/** Direct edit of a shop's grid from Admin → Listings. Blank status removes the cell. Every change needs a reason and is logged. */
export async function adminSaveCells(shopId:string,cells:AdminCell[],note:string):Promise<{error?:string;changed?:number}>{
  const {supabase}=await requireStaff();
  if(!/^[0-9a-f-]{36}$/i.test(shopId))return {error:"Unknown listing."};
  const reason=String(note||"").trim().slice(0,500);
  if(reason.length<5)return {error:"Add a short reason for the change (at least 5 characters)."};
  const {data:shop}=await supabase.from("service_centres").select("slug").eq("id",shopId).maybeSingle();if(!shop)return {error:"Listing not found."};
  const {data:existing}=await supabase.from("shop_capabilities").select("bike_level,service_level,status,brands").eq("shop_id",shopId);
  const key=(l:string,s:string)=>`${l}|${s}`;const current=new Map((existing||[]).map(c=>[key(c.bike_level,c.service_level),c]));
  const clean=(b:unknown)=>Array.isArray(b)?[...new Set(b.map(x=>String(x).trim()).filter(Boolean))].slice(0,12):[];
  let changed=0;
  for(const c of cells||[]){
    if(!isBikeLevel(c.level)||!isServiceLevel(c.service))continue;
    const was=current.get(key(c.level,c.service));const brands=clean(c.brands);
    if(!c.status){
      if(was){await supabase.from("shop_capabilities").delete().eq("shop_id",shopId).eq("bike_level",c.level).eq("service_level",c.service);changed++}
      continue;
    }
    if(!isStatus(c.status))continue;
    if(was&&was.status===c.status&&(was.brands||[]).join("|")===brands.join("|"))continue;
    const {error}=await supabase.from("shop_capabilities").upsert({shop_id:shopId,bike_level:c.level,service_level:c.service,status:c.status,brands,source:"admin",note:`Admin edit: ${reason}`},{onConflict:"shop_id,bike_level,service_level"});
    if(error)return {error:`Could not save: ${error.message}`};
    changed++;
  }
  revalidatePath(`/services/${shop.slug}`);revalidatePath("/services");revalidatePath("/admin","layout");revalidatePath("/partner/dashboard");
  return {changed};
}

/** Admin → Audits: confirm or correct a bike's type. Confirmed bikes leave the double-check list. Admins only (database rule). */
export async function reviewBike(id:string,level:string):Promise<{error?:string}>{
  const {supabase}=await requireStaff();
  if(!isBikeLevel(level))return {error:"Choose a bike type."};
  const {data,error}=await supabase.from("bike_models").update({bike_level:level,needs_review:false}).eq("id",String(id).slice(0,80)).select("id").maybeSingle();
  if(error)return {error:`Could not save: ${error.message}`};
  if(!data)return {error:"Only admins can change bike types."}; // the database rule lets admins (not moderators) edit bikes
  revalidatePath("/admin/audits");revalidatePath("/services");
  return {};
}
