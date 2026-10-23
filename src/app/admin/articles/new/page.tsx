import Link from "next/link";import {ArrowLeft} from "lucide-react";import {DashShell,Flash} from "@/components/dashboard";import {ArticleForm} from "@/components/content-forms";import {requireStaff} from "@/lib/admin";
export const metadata={title:"New article · Admin"};
export default async function NewArticle({searchParams}:{searchParams:Promise<{error?:string}>}){await requireStaff();const sp=await searchParams;
return <DashShell area="admin" active="articles" title="New article" actions={<Link className="button secondary small" href="/admin/articles"><ArrowLeft/> All articles</Link>}><Flash error={sp.error}/><ArticleForm/></DashShell>}
