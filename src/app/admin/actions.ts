"use server";
import {revalidatePath} from "next/cache";import {redirect} from "next/navigation";import {requireStaff,VERIFICATION_STATUSES} from "@/lib/admin";import {isSkill} from "@/lib/matrix/config";
const LISTING_TYPES=["service_centre","repair_shop","gear_shop"];
const slugify=(s:string)=>s.normalize("NFKD").replace(/[^\w\s-]/g,"").trim().toLowerCase().replace(/[\s_-]+/g,"-").slice(0,60)||"listing";
function refresh(slug?:string){revalidatePath("/admin","layout");revalidatePath("/services");revalidatePath("/");if(slug)revalidatePath(`/services/${slug}`)}

export async function setVerification(form:FormData){
  const {supabase}=await requireStaff();const status=String(form.get("status"));
  if(!(VERIFICATION_STATUSES as readonly string[]).includes(status))return;
  await supabase.from("service_centres").update({verification_status:status,last_verified_at:status==="verified"?new Date().toISOString():null,manually_edited:true}).eq("id",String(form.get("id")));
  refresh();
}
export async function setListingActive(form:FormData){
  const {supabase}=await requireStaff();
  await supabase.from("service_centres").update({is_active:form.get("active")==="true",manually_edited:true}).eq("id",String(form.get("id")));
  refresh();
}
/** Switches a city on or off for riders. Its listings stay as they are; only who can see them changes. */
export async function setCityLive(form:FormData){
  const {supabase,user}=await requireStaff();
  const name=String(form.get("name")||"").trim().slice(0,80);if(!name)return;
  const {error}=await supabase.from("cities").upsert({name,is_live:form.get("live")==="true",updated_at:new Date().toISOString(),updated_by:user.id});
  if(error)redirect(`/admin/cities?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/","layout");
}
export async function markContactRead(form:FormData){
  const {supabase}=await requireStaff();
  await supabase.from("contact_messages").update({status:form.get("status")==="new"?"new":"read"}).eq("id",String(form.get("id")));
  revalidatePath("/admin","layout");
}

/** Creates or updates a listing from the admin editor. Edited rows are flagged so the OSM import leaves them alone. */
export async function saveListing(form:FormData){
  const {supabase}=await requireStaff();
  const id=String(form.get("id")||"");const back=id?`/admin/listings/${id}`:"/admin/listings/new";
  const text=(k:string,max=300)=>String(form.get(k)||"").trim().slice(0,max)||null;
  const num=(k:string)=>{const v=String(form.get(k)||"").trim();const n=Number(v);return v&&Number.isFinite(n)?n:null};
  const name=text("name",120),city=text("city",80),state=text("state",80),listing_type=String(form.get("listing_type"));
  if(!name||!city||!state)redirect(`${back}?error=${encodeURIComponent("Name, city and state are required.")}`);
  if(!LISTING_TYPES.includes(listing_type))redirect(`${back}?error=${encodeURIComponent("Choose a listing type.")}`);
  const verification_status=String(form.get("verification_status"));
  const latitude=num("latitude"),longitude=num("longitude");
  if((latitude!==null&&Math.abs(latitude)>90)||(longitude!==null&&Math.abs(longitude)>180))redirect(`${back}?error=${encodeURIComponent("Latitude or longitude is out of range.")}`);
  const row={name,listing_type,city,state,centre_type:text("centre_type",120),description:text("description",3000),address_line:text("address_line"),locality:text("locality",120),postal_code:text("postal_code",12),
    latitude,longitude,phone:text("phone",60),email:text("email",120),website:text("website",200),opening_hours_text:text("opening_hours_text",200),
    brands:String(form.get("brands")||"").split(",").map(b=>b.trim()).filter(Boolean).slice(0,10),
    official_brands:String(form.get("official_brands")||"").split(",").map(b=>b.trim()).filter(Boolean).slice(0,6),
    brand_exclusive:form.get("brand_exclusive")==="on",skills:form.getAll("skills").map(String).filter(isSkill),
    verification_status:(VERIFICATION_STATUSES as readonly string[]).includes(verification_status)?verification_status:"unverified",
    is_active:form.get("is_active")==="on",is_featured:form.get("is_featured")==="on",manually_edited:true};
  let saved:{id:string;slug:string}|null=null;let message:string|undefined;
  if(id){const {data,error}=await supabase.from("service_centres").update(row).eq("id",id).select("id,slug").single();saved=data;message=error?.message}
  else{const {data,error}=await supabase.from("service_centres").insert({...row,source:"partner",slug:`${slugify(name)}-${crypto.randomUUID().slice(0,6)}`}).select("id,slug").single();saved=data;message=error?.message}
  if(!saved)redirect(`${back}?error=${encodeURIComponent(message||"Could not save the listing.")}`);
  const ownerEmail=String(form.get("owner_email")||"").trim();
  if(ownerEmail!==String(form.get("current_owner")||"").trim()){
    const {error}=await supabase.rpc("admin_set_owner",{p_centre:saved.id,p_email:ownerEmail});
    if(error){refresh(saved.slug);redirect(`/admin/listings/${saved.id}?error=${encodeURIComponent(error.message)}`)}
  }
  refresh(saved.slug);redirect(`/admin/listings/${saved.id}?saved=1`);
}
