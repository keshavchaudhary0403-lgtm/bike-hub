import {redirect} from "next/navigation";import {getSessionProfile} from "@/lib/supabase-server";
/** Signed-in admin or moderator, or redirect. Use in every admin page and action. */
export async function requireStaff(){
  const s=await getSessionProfile();
  if(!s.supabase||!s.user)redirect("/partner/login");
  if(s.profile?.role!=="admin"&&s.profile?.role!=="moderator")redirect("/partner/dashboard");
  return {supabase:s.supabase,user:s.user,profile:s.profile};
}
export const VERIFICATION_STATUSES=["unverified","pending","verified","rejected","suspended"] as const;
export const ENQUIRY_STATUSES=["new","accepted","quoted","closed","declined"] as const;
export const escapeLike=(s:string)=>s.replace(/[%_\\]/g,m=>"\\"+m);
export const formatDate=(d:string)=>new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
