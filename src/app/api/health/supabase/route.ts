import {NextResponse} from "next/server";import {getConnectionHealth} from "@/lib/supabase-data";
export const dynamic="force-dynamic";
export async function GET(){const result=await getConnectionHealth();return NextResponse.json(result,{status:result.connected?200:503,headers:{"Cache-Control":"no-store"}})}
