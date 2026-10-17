import Link from "next/link";import {ArrowLeft} from "lucide-react";import {DashShell,Flash} from "@/components/dashboard";import {ListingForm} from "@/components/listing-form";import {requireStaff} from "@/lib/admin";
export const metadata={title:"New listing · Admin"};
export default async function NewListing({searchParams}:{searchParams:Promise<{error?:string}>}){await requireStaff();const {error}=await searchParams;
return <DashShell area="admin" active="listings" title="New listing" subtitle="Add a service centre, repair shop or gear shop that isn’t on BikeHub yet." actions={<Link className="button secondary small" href="/admin/listings"><ArrowLeft/> All listings</Link>}><Flash error={error}/><ListingForm/></DashShell>}
