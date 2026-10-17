"use server";
import {createClient} from "@supabase/supabase-js";
export type ContactState={ok:boolean;error?:string};
export async function sendContactMessage(_prev:ContactState,form:FormData):Promise<ContactState>{
  const name=String(form.get("name")||"").trim(),email=String(form.get("email")||"").trim(),message=String(form.get("message")||"").trim();
  if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||message.length<5)return {ok:false,error:"Please enter your name, a valid email and a message."};
  if(message.length>5000)return {ok:false,error:"Please keep your message under 5,000 characters."};
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return {ok:false,error:"Messaging is not configured yet. Please try again later."};
  const {error}=await createClient(url,key,{auth:{persistSession:false}}).from("contact_messages").insert({name,email,message});
  return error?{ok:false,error:"We couldn't send your message. Please try again."}:{ok:true};
}
