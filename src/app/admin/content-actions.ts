"use server";
import {revalidatePath} from "next/cache";import {redirect} from "next/navigation";import {requireStaff} from "@/lib/admin";import {POST_CATEGORIES} from "@/lib/community";import {recomputeCell} from "@/lib/matrix/recompute";
const slugify=(s:string)=>s.normalize("NFKD").replace(/[^\w\s-]/g,"").trim().toLowerCase().replace(/[\s_-]+/g,"-").slice(0,70)||"item";
const text=(form:FormData,k:string,max=300)=>String(form.get(k)||"").trim().slice(0,max)||null;
const fail=(back:string,message:string):never=>redirect(`${back}?error=${encodeURIComponent(message)}`);
// Routes, articles, reviews and comments show up across the whole site (home, lists, detail pages).
const refresh=()=>revalidatePath("/","layout");
type Staff=Awaited<ReturnType<typeof requireStaff>>["supabase"];
/** A slug not used by another row of the table. */
async function freeSlug(supabase:Staff,table:"routes"|"posts",base:string){
  const {data}=await supabase.from(table).select("slug").like("slug",`${base}%`);
  const taken=new Set((data||[]).map(r=>r.slug));if(!taken.has(base))return base;
  for(let i=2;;i++)if(!taken.has(`${base}-${i}`))return `${base}-${i}`;
}

/** "Label | https://…" per line. */
function parseSources(raw:string){
  return raw.split("\n").map(l=>l.trim()).filter(Boolean).slice(0,20).map(l=>{const [label,url]=l.includes("|")?l.split("|").map(x=>x.trim()):[l,l];return {label:label||url,url}}).filter(s=>/^https?:\/\/\S+$/.test(s.url));
}
export async function saveRoute(form:FormData){
  const {supabase}=await requireStaff();
  const id=String(form.get("id")||"");const back=id?`/admin/routes/${id}`:"/admin/routes/new";
  const name=text(form,"name",120);if(!name)fail(back,"Give the route a name.");
  const km=String(form.get("distance_km")||"").trim();const distance_km=km?Math.round(Number(km)):null;
  if(distance_km!==null&&!(distance_km>0&&distance_km<20000))fail(back,"Distance must be a number of kilometres.");
  const row={name:name!,summary:text(form,"summary",300),description:text(form,"description",20000),start_location:text(form,"start_location",120),end_location:text(form,"end_location",120),
    distance_km,duration_text:text(form,"duration_text",60),difficulty:text(form,"difficulty",40),best_season:text(form,"best_season",80),safety_notes:text(form,"safety_notes",5000),
    hero_image_url:text(form,"hero_image_url",500),sources:parseSources(String(form.get("sources")||"")),status:form.get("published")==="on"?"published":"draft",is_featured:form.get("is_featured")==="on",updated_at:new Date().toISOString()};
  const {data,error}=id?await supabase.from("routes").update(row).eq("id",id).select("id").single()
    :await supabase.from("routes").insert({...row,slug:await freeSlug(supabase,"routes",slugify(name!))}).select("id").single();
  if(!data)fail(back,error?.message||"Could not save the route.");
  refresh();redirect(`/admin/routes/${data!.id}?saved=1`);
}
export async function deleteRoute(form:FormData){
  const {supabase}=await requireStaff();
  const {error}=await supabase.from("routes").delete().eq("id",String(form.get("id")));
  if(error)fail(`/admin/routes/${form.get("id")}`,error.message);
  refresh();redirect("/admin/routes");
}

export async function savePost(form:FormData){
  const {supabase}=await requireStaff();
  const id=String(form.get("id")||"");const back=id?`/admin/articles/${id}`:"/admin/articles/new";
  const title=text(form,"title",160),body=text(form,"body",50000),category=String(form.get("category"));
  if(!title||!body)fail(back,"Title and article text are required.");
  if(!POST_CATEGORIES.includes(category))fail(back,"Choose a category.");
  const published=form.get("published")==="on";
  const row={title:title!,category,body:body!,excerpt:text(form,"excerpt",300),author_name:text(form,"author_name",80),hero_image_url:text(form,"hero_image_url",500),
    sources:parseSources(String(form.get("sources")||"")),is_expert_content:form.get("is_expert_content")==="on",status:published?"published":"draft",updated_at:new Date().toISOString()};
  // Keep the original publish date when editing; set it the first time an article goes live.
  const {data:current}=id?await supabase.from("posts").select("published_at").eq("id",id).maybeSingle():{data:null};
  const published_at=published?current?.published_at||new Date().toISOString():current?.published_at||null;
  const {data,error}=id?await supabase.from("posts").update({...row,published_at}).eq("id",id).select("id").single()
    :await supabase.from("posts").insert({...row,published_at,slug:await freeSlug(supabase,"posts",slugify(title!))}).select("id").single();
  if(!data)fail(back,error?.message||"Could not save the article.");
  refresh();redirect(`/admin/articles/${data!.id}?saved=1`);
}
export async function deletePost(form:FormData){
  const {supabase}=await requireStaff();
  const {error}=await supabase.from("posts").delete().eq("id",String(form.get("id")));
  if(error)fail(`/admin/articles/${form.get("id")}`,error.message);
  refresh();redirect("/admin/articles");
}

/** Approve (publish), hide (archive) or delete a rider review or comment. */
export async function moderate(form:FormData){
  const {supabase}=await requireStaff();
  const table=form.get("kind")==="comment"?"comments":"reviews";const id=String(form.get("id"));const action=String(form.get("action"));
  // A review about a bike type and job can move that shop's cell to or from "Proven".
  const {data:review}=table==="reviews"?await supabase.from("reviews").select("centre_id,bike_level,service_level").eq("id",id).maybeSingle():{data:null};
  if(action==="delete")await supabase.from(table).delete().eq("id",id);
  else if(action==="approve"||action==="hide")await supabase.from(table).update({status:action==="approve"?"published":"archived"}).eq("id",id);
  if(review?.centre_id&&review.bike_level&&review.service_level)await recomputeCell(supabase,review.centre_id,review.bike_level,review.service_level);
  refresh();
}
export async function setStoryStatus(form:FormData){
  const {supabase}=await requireStaff();const status=String(form.get("status"));
  if(!["new","accepted","declined"].includes(status))return;
  await supabase.from("story_submissions").update({status}).eq("id",String(form.get("id")));
  revalidatePath("/admin","layout");
}
/** Copies a rider's story into a new draft article for editing, and marks the story accepted. */
export async function storyToDraft(form:FormData){
  const {supabase}=await requireStaff();const id=String(form.get("id"));
  const {data:story}=await supabase.from("story_submissions").select("name,title,category,body").eq("id",id).single();
  if(!story)fail("/admin/approvals?tab=stories","Story not found.");
  const firstPara=story!.body.split(/\n\s*\n/)[0].trim();
  const {data,error}=await supabase.from("posts").insert({title:story!.title,category:story!.category,body:story!.body,author_name:story!.name,
    excerpt:firstPara.length>200?firstPara.slice(0,197).trimEnd()+"…":firstPara,status:"draft",slug:await freeSlug(supabase,"posts",slugify(story!.title))}).select("id").single();
  if(!data)fail("/admin/approvals?tab=stories",error?.message||"Could not create the draft.");
  await supabase.from("story_submissions").update({status:"accepted"}).eq("id",id);
  revalidatePath("/admin","layout");redirect(`/admin/articles/${data!.id}?saved=1`);
}
