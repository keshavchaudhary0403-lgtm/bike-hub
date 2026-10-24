"use server";
import {revalidatePath} from "next/cache";import {redirect} from "next/navigation";import {getSessionProfile} from "@/lib/supabase-server";import {isBikeLevel,isServiceLevel,isSkill} from "@/lib/matrix/config";
const ENQUIRY_STATUSES=["new","accepted","quoted","closed","declined"];
// Row-level security also restricts these writes to the partner's own centres (or admins).
export async function signOut(){const {supabase}=await getSessionProfile();await supabase?.auth.signOut();redirect("/partner/login")}
export async function updateCentre(form:FormData){
  const {supabase,user}=await getSessionProfile();if(!supabase||!user)redirect("/partner/login");
  const text=(k:string,max:number)=>String(form.get(k)||"").trim().slice(0,max)||null;
  const {data,error}=await supabase.from("service_centres").update({phone:text("phone",40),email:text("email",120),website:text("website",200),opening_hours_text:text("opening_hours_text",200),description:text("description",2000),manually_edited:true}).eq("id",String(form.get("id"))).eq("owner_id",user.id).select("slug").maybeSingle();
  if(data)revalidatePath(`/services/${data.slug}`);
  revalidatePath("/partner/dashboard");
  redirect(error||!data?`/partner/dashboard?error=${encodeURIComponent("Could not save your listing.")}#profile`:"/partner/dashboard?saved=1#profile");
}
export async function updateEnquiryStatus(form:FormData){
  const {supabase,user}=await getSessionProfile();if(!supabase||!user)redirect("/partner/login");
  const status=String(form.get("status"));if(!ENQUIRY_STATUSES.includes(status))return;
  await supabase.from("enquiries").update({status}).eq("id",String(form.get("id")));
  revalidatePath("/partner/dashboard");revalidatePath("/admin","layout");
}
/** Saves a listing's photo order (first is the cover). Partners can only touch their own listings: RLS and the photos check enforce it. */
export async function saveListingPhotos(id:string,photos:string[]):Promise<{error?:string}>{
  const {supabase,user}=await getSessionProfile();if(!supabase||!user)return {error:"Please sign in again."};
  if(!Array.isArray(photos)||photos.length>8||photos.some(p=>typeof p!=="string"||!p.startsWith(`${id}/`)))return {error:"Invalid photos."};
  const {data,error}=await supabase.from("service_centres").update({photos,manually_edited:true}).eq("id",id).select("slug").maybeSingle();
  if(error||!data)return {error:"Could not save photos."};
  revalidatePath(`/services/${data.slug}`);revalidatePath("/services");revalidatePath("/");revalidatePath("/partner/dashboard");revalidatePath("/admin","layout");
  return {};
}

// ── Capability footprint: partners tick what they can handle. They can only ever CLAIM;
// "Checked by BikeHub" and "Proven" come from BikeHub visits and rider reviews (RLS enforces this too).
export type FootprintCell={level:string;service:string};
export type FootprintInput={cells:FootprintCell[];rowBrands:Record<string,string[]>;skills:string[]};
const cleanBrands=(b:unknown)=>Array.isArray(b)?[...new Set(b.map(x=>String(x).trim()).filter(Boolean))].slice(0,12).map(x=>x.slice(0,40)):[];

export async function saveFootprint(centreId:string,input:FootprintInput):Promise<{error?:string}>{
  const {supabase,user}=await getSessionProfile();if(!supabase||!user)return {error:"Please sign in again."};
  const cells=(input.cells||[]).filter(c=>isBikeLevel(c.level)&&isServiceLevel(c.service));
  const skills=(input.skills||[]).filter(isSkill);
  const {data:centre}=await supabase.from("service_centres").select("id,slug").eq("id",centreId).maybeSingle();
  if(!centre)return {error:"Listing not found."};
  const {data:existing,error:readError}=await supabase.from("shop_capabilities").select("bike_level,service_level,brands,status").eq("shop_id",centreId);
  if(readError)return {error:"Could not load your current answers."};
  const key=(l:string,s:string)=>`${l}|${s}`;
  const wanted=new Map(cells.map(c=>[key(c.level,c.service),c]));
  const current=new Map((existing||[]).map(c=>[key(c.bike_level,c.service_level),c]));
  const brandsFor=(level:string)=>cleanBrands(input.rowBrands?.[level]);
  const inserts=cells.filter(c=>!current.has(key(c.level,c.service))).map(c=>({shop_id:centreId,bike_level:c.level,service_level:c.service,brands:brandsFor(c.level),status:"claimed",source:"partner",note:"Ticked by the partner"}));
  const removals=(existing||[]).filter(c=>c.status==="claimed"&&!wanted.has(key(c.bike_level,c.service_level)));
  const changes=(existing||[]).filter(c=>c.status==="claimed"&&wanted.has(key(c.bike_level,c.service_level))&&brandsFor(c.bike_level).join("|")!==(c.brands||[]).join("|"));
  if(inserts.length){const {error}=await supabase.from("shop_capabilities").insert(inserts);if(error)return {error:"Could not save. Please try again."}}
  for(const c of removals)await supabase.from("shop_capabilities").delete().eq("shop_id",centreId).eq("bike_level",c.bike_level).eq("service_level",c.service_level).eq("status","claimed");
  for(const c of changes)await supabase.from("shop_capabilities").update({brands:brandsFor(c.bike_level),source:"partner",note:"Brands changed by the partner"}).eq("shop_id",centreId).eq("bike_level",c.bike_level).eq("service_level",c.service_level).eq("status","claimed");
  const {error:skillError}=await supabase.from("service_centres").update({skills,manually_edited:true}).eq("id",centreId);
  if(skillError)return {error:"Saved what you handle, but not your specialities."};
  revalidatePath(`/services/${centre.slug}`);revalidatePath("/partner/dashboard");revalidatePath("/admin","layout");
  return {};
}

/** "Request visit": asks BikeHub to check cells a claim alone can't show to riders. */
export async function requestVisit(centreId:string,cells:FootprintCell[],note:string):Promise<{error?:string}>{
  const {supabase,user}=await getSessionProfile();if(!supabase||!user)return {error:"Please sign in again."};
  const list=(cells||[]).filter(c=>isBikeLevel(c.level)&&isServiceLevel(c.service)).map(c=>[c.level,c.service]);
  const {error}=await supabase.from("audit_requests").insert({shop_id:centreId,cells:list,note:String(note||"").trim().slice(0,1000)||null});
  if(error)return {error:"Could not send the request. Please try again."};
  revalidatePath("/partner/dashboard");revalidatePath("/admin","layout");
  return {};
}

/** Evidence photo for a cell (scanner screen, equipment, bikes in the workshop). The file is already in storage under the listing's folder. */
export async function addEvidence(centreId:string,path:string,level:string|null,service:string|null,note:string):Promise<{error?:string;id?:string}>{
  const {supabase,user}=await getSessionProfile();if(!supabase||!user)return {error:"Please sign in again."};
  if(!path.startsWith(`${centreId}/evidence/`)||path.includes(".."))return {error:"Invalid photo."};
  const {data,error}=await supabase.from("capability_evidence").insert({shop_id:centreId,bike_level:isBikeLevel(level)?level:null,service_level:isServiceLevel(service)?service:null,type:"photo",url_or_ref:path,note:String(note||"").trim().slice(0,500)||null}).select("id").single();
  if(error)return {error:"Could not save the photo."};
  revalidatePath("/partner/dashboard");return {id:data.id};
}
export async function removeEvidence(id:string):Promise<{error?:string}>{
  const {supabase,user}=await getSessionProfile();if(!supabase||!user)return {error:"Please sign in again."};
  const {data,error}=await supabase.from("capability_evidence").delete().eq("id",id).select("url_or_ref").maybeSingle();
  if(error||!data)return {error:"Could not remove the photo."};
  await supabase.storage.from("listing-photos").remove([data.url_or_ref]);
  revalidatePath("/partner/dashboard");return {};
}
