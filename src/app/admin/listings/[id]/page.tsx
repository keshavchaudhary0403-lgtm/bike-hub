import Link from "next/link";import {notFound} from "next/navigation";import {ArrowLeft} from "lucide-react";import {DashShell,Flash,Pill} from "@/components/dashboard";import {ListingForm,type ListingRow} from "@/components/listing-form";import {requireStaff} from "@/lib/admin";
export const metadata={title:"Edit listing · Admin"};
export default async function EditListing({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{saved?:string;error?:string}>}){const {supabase}=await requireStaff();const [{id},sp]=await Promise.all([params,searchParams]);
if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
const [{data},{data:owner}]=await Promise.all([supabase.from("service_centres").select("*").eq("id",id).maybeSingle(),supabase.rpc("admin_owner_email",{p_centre:id})]);if(!data)notFound();const l=data as ListingRow;
return <DashShell area="admin" active="listings" title={l.name} subtitle={[l.locality,l.city].filter(Boolean).join(", ")} actions={<><Pill value={l.is_active?"live":"hidden"} label={l.is_active?"Live":"Hidden"}/><Pill value={l.verification_status}/><Link className="button secondary small" href="/admin/listings"><ArrowLeft/> All listings</Link></>}>
<Flash saved={sp.saved} error={sp.error}/><ListingForm listing={l} ownerEmail={owner as string|null}/></DashShell>}
