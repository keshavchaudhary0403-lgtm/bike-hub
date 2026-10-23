import Link from "next/link";import {ArrowLeft} from "lucide-react";import {DashShell,Flash} from "@/components/dashboard";import {RouteForm} from "@/components/content-forms";import {requireStaff} from "@/lib/admin";
export const metadata={title:"New route · Admin"};
export default async function NewRoute({searchParams}:{searchParams:Promise<{error?:string}>}){await requireStaff();const sp=await searchParams;
return <DashShell area="admin" active="routes" title="New route" actions={<Link className="button secondary small" href="/admin/routes"><ArrowLeft/> All routes</Link>}><Flash error={sp.error}/><RouteForm/></DashShell>}
