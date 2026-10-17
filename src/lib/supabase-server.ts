import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
/** Request-scoped client that carries the signed-in partner/admin session. */
export async function createServerSupabase(){
  const store=await cookies();
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return null;
  return createServerClient(url,key,{cookies:{getAll:()=>store.getAll(),setAll(list){try{list.forEach(({name,value,options})=>store.set(name,value,options))}catch{/* called from a Server Component; proxy refreshes the session */}}}});
}
export async function getSessionProfile(){
  const supabase=await createServerSupabase();if(!supabase)return {supabase:null,user:null,profile:null};
  const {data:{user}}=await supabase.auth.getUser();if(!user)return {supabase,user:null,profile:null};
  const {data:profile}=await supabase.from("profiles").select("id,role,display_name").eq("id",user.id).single();
  return {supabase,user,profile:profile as {id:string;role:"partner"|"moderator"|"admin";display_name:string}|null};
}
