import Link from "next/link";import {notFound} from "next/navigation";import {ArrowLeft} from "lucide-react";import {DashShell,Flash,PublishPill} from "@/components/dashboard";import {RouteForm,type RouteRow} from "@/components/content-forms";import {requireStaff} from "@/lib/admin";
export const metadata={title:"Edit route · Admin"};
export default async function EditRoute({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{saved?:string;error?:string}>}){const {supabase}=await requireStaff();const [{id},sp]=await Promise.all([params,searchParams]);
if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
const {data}=await supabase.from("routes").select("*").eq("id",id).maybeSingle();if(!data)notFound();const r=data as RouteRow;
return <DashShell area="admin" active="routes" title={r.name} actions={<><PublishPill status={r.status}/><Link className="button secondary small" href="/admin/routes"><ArrowLeft/> All routes</Link></>}>
<Flash saved={sp.saved} error={sp.error}/><RouteForm route={r}/></DashShell>}
