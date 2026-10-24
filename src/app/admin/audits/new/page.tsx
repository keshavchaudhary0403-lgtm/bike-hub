import Link from "next/link";import {notFound} from "next/navigation";import {ArrowLeft} from "lucide-react";import {DashShell} from "@/components/dashboard";import {AuditForm} from "@/components/audit-form";import {requireStaff} from "@/lib/admin";import {isBikeLevel,isServiceLevel,type BikeLevel,type ServiceLevel} from "@/lib/matrix/config";
export const metadata={title:"New audit · Admin"};
export default async function NewAudit({searchParams}:{searchParams:Promise<{shop?:string}>}){const {supabase}=await requireStaff();const {shop:id}=await searchParams;
if(!id||!/^[0-9a-f-]{36}$/i.test(id))notFound();
const [{data:shop},{data:cells}]=await Promise.all([supabase.from("service_centres").select("id,name,city,locality").eq("id",id).maybeSingle(),supabase.from("shop_capabilities").select("bike_level,service_level,status").eq("shop_id",id)]);
if(!shop)notFound();
const current=(cells||[]).flatMap(c=>isBikeLevel(c.bike_level)&&isServiceLevel(c.service_level)?[{level:c.bike_level as BikeLevel,service:c.service_level as ServiceLevel,status:c.status as string}]:[]);
return <DashShell area="admin" active="audits" title={`Audit: ${shop.name}`} subtitle={[shop.locality,shop.city].filter(Boolean).join(", ")} actions={<Link className="button secondary small" href="/admin/audits"><ArrowLeft/> All audits</Link>}>
<AuditForm shop={{id:shop.id,name:shop.name,city:shop.city}} current={current}/></DashShell>}
