"use server";
import {revalidatePath} from "next/cache";import {redirect} from "next/navigation";import {getSessionProfile} from "@/lib/supabase-server";
async function requireStaff(){const s=await getSessionProfile();if(!s.supabase||!s.user)redirect("/partner/login");if(s.profile?.role!=="admin"&&s.profile?.role!=="moderator")throw new Error("Not authorised");return s.supabase}
export async function setVerification(form:FormData){
  const supabase=await requireStaff();const status=String(form.get("status"));
  if(!["unverified","pending","verified","rejected","suspended"].includes(status))return;
  await supabase.from("service_centres").update({verification_status:status,last_verified_at:status==="verified"?new Date().toISOString():null}).eq("id",String(form.get("id")));
  revalidatePath("/admin");
}
export async function setListingActive(form:FormData){
  const supabase=await requireStaff();
  await supabase.from("service_centres").update({is_active:form.get("active")==="true"}).eq("id",String(form.get("id")));
  revalidatePath("/admin");
}
export async function markContactRead(form:FormData){
  const supabase=await requireStaff();
  await supabase.from("contact_messages").update({status:"read"}).eq("id",String(form.get("id")));
  revalidatePath("/admin");
}
