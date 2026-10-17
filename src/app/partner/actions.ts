"use server";
import {revalidatePath} from "next/cache";import {redirect} from "next/navigation";import {getSessionProfile} from "@/lib/supabase-server";
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
