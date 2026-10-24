// Bike types as corrected by admins. src/data/bike-models.ts is the starting list; the bike_models table
// holds the live classification, so a fix made in Admin → Audits applies at once without a code change.
import {cache} from "react";
import {publicClient} from "@/lib/supabase-data";
import {isBikeLevel,type BikeLevel} from "./config";

/** Model id → bike level from the database. Empty when the database can't be reached (the code list is used). */
export const getBikeLevels=cache(async():Promise<Map<string,BikeLevel>>=>{
  const supabase=publicClient();if(!supabase)return new Map();
  const {data,error}=await supabase.from("bike_models").select("id,bike_level");
  if(error){console.error("getBikeLevels",error.message);return new Map()}
  return new Map((data||[]).flatMap(r=>isBikeLevel(r.bike_level)?[[r.id as string,r.bike_level]]:[]));
});
