"use server";
// Public submissions from riders: no account needed. Everything is saved as a draft for an admin to approve.
import {publicClient} from "@/lib/supabase-data";
import {POST_CATEGORIES} from "@/lib/community";
export type FormState={ok:boolean;error?:string};
const UUID=/^[0-9a-f-]{36}$/i;
const field=(form:FormData,key:string,max:number)=>String(form.get(key)||"").trim().slice(0,max);
/** Bots fill every field, people never see this one. Pretend it worked. */
const isBot=(form:FormData)=>Boolean(form.get("company"));

export async function submitReview(_prev:FormState,form:FormData):Promise<FormState>{
  if(isBot(form))return {ok:true};
  const centre_id=field(form,"centre_id",36),reviewer_name=field(form,"name",80),body=field(form,"body",2000),service_used=field(form,"service",120);
  const overall_rating=Number(form.get("rating"));
  if(!UUID.test(centre_id))return {ok:false,error:"This listing can’t take reviews right now."};
  if(!(overall_rating>=1&&overall_rating<=5&&Number.isInteger(overall_rating)))return {ok:false,error:"Please choose a star rating."};
  if(reviewer_name.length<2)return {ok:false,error:"Please enter your name."};
  const supabase=publicClient();if(!supabase)return {ok:false,error:"Reviews are not available yet. Please try again later."};
  const {error}=await supabase.from("reviews").insert({centre_id,reviewer_name,overall_rating,body:body||null,service_used:service_used||null,status:"draft"});
  return error?{ok:false,error:"We couldn’t save your review. Please try again."}:{ok:true};
}

export async function submitComment(_prev:FormState,form:FormData):Promise<FormState>{
  if(isBot(form))return {ok:true};
  const post_id=field(form,"post_id",36),display_name=field(form,"name",80),body=field(form,"body",2000);
  if(!UUID.test(post_id))return {ok:false,error:"Comments are closed on this article."};
  if(display_name.length<2||body.length<3)return {ok:false,error:"Please enter your name and a comment."};
  const supabase=publicClient();if(!supabase)return {ok:false,error:"Comments are not available yet. Please try again later."};
  const {error}=await supabase.from("comments").insert({post_id,display_name,body,status:"draft"});
  return error?{ok:false,error:"We couldn’t save your comment. Please try again."}:{ok:true};
}

export async function submitStory(_prev:FormState,form:FormData):Promise<FormState>{
  if(isBot(form))return {ok:true};
  const name=field(form,"name",80),email=field(form,"email",120),title=field(form,"title",160),category=field(form,"category",40),body=field(form,"body",20000);
  if(name.length<2||!/^\S+@\S+\.\S+$/.test(email))return {ok:false,error:"Please enter your name and a valid email."};
  if(title.length<5)return {ok:false,error:"Please give your story a title (at least 5 characters)."};
  if(!POST_CATEGORIES.includes(category))return {ok:false,error:"Please choose a topic."};
  if(body.length<50)return {ok:false,error:"Please write a little more: at least 50 characters."};
  const supabase=publicClient();if(!supabase)return {ok:false,error:"Story sharing is not available yet. Please try again later."};
  const {error}=await supabase.from("story_submissions").insert({name,email,title,category,body});
  return error?{ok:false,error:"We couldn’t send your story. Please try again."}:{ok:true};
}
