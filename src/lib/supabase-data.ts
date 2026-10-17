import {createClient} from "@supabase/supabase-js";
import {centres} from "@/lib/data";

function publicClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url&&key?createClient(url,key,{auth:{persistSession:false}}):null;
}

export async function getCentres(filters?:{q?:string;location?:string}){
  const supabase=publicClient();
  if(!supabase)return filterCentres(centres,filters);
  const {data,error}=await supabase.from("service_centres").select("slug,name,description,centre_type,locality,city,opening_hours,verification_status,is_featured").eq("is_active",true).order("is_featured",{ascending:false}).limit(12);
  if(error||!data?.length)return filterCentres(centres,filters);
  const mapped=data.map((row,index)=>{
    const local=centres.find(c=>c.slug===row.slug)||centres[index%centres.length];
    return {...local,name:row.name,type:row.centre_type||local.type,location:[row.locality,row.city].filter(Boolean).join(", "),tags:local.tags};
  });
  return filterCentres(mapped,filters);
}

function filterCentres<T extends (typeof centres)[number]>(items:T[],filters?:{q?:string;location?:string}){
  const q=filters?.q?.trim().toLowerCase();const location=filters?.location?.trim().toLowerCase();
  return items.filter(c=>{
    const haystack=[c.name,c.type,c.location,...c.tags].join(" ").toLowerCase();
    const qMatch=!q||q.includes("service centre")||haystack.includes(q)||q.split(/\s+/).some(term=>term.length>3&&haystack.includes(term));
    const locationMatch=!location||c.location.toLowerCase().includes(location)||location.includes(c.location.split(",").pop()?.trim().toLowerCase()||"");
    return qMatch&&locationMatch;
  });
}

export async function getConnectionHealth(){
  const supabase=publicClient();
  if(!supabase)return {connected:false,message:"Supabase environment variables are missing."};
  const {count,error}=await supabase.from("service_centres").select("id",{count:"exact",head:true});
  return error?{connected:false,message:error.message}:{connected:true,message:"Vercel can reach Supabase.",centreCount:count||0};
}
