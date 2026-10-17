// Imports motorcycle service centres, repair shops and riding-gear shops from
// OpenStreetMap (Overpass API) into Supabase `service_centres`.
// Usage: npm run import:osm            (all cities)
//        npm run import:osm -- pune    (cities whose key contains "pune")
//        npm run import:osm -- --dry   (fetch and classify only, no writes)
import {createClient} from "@supabase/supabase-js";

try{process.loadEnvFile(".env.local")}catch{}

// [key, city label, state, south, west, north, east]. Overlapping boxes are
// fine: the first city to claim an OSM element keeps it.
const CITIES=[
 ["noida","Noida","Uttar Pradesh",28.45,77.29,28.64,77.52],
 ["ghaziabad","Ghaziabad","Uttar Pradesh",28.64,77.36,28.76,77.52],
 ["gurugram","Gurugram","Haryana",28.36,76.92,28.53,77.12],
 ["faridabad","Faridabad","Haryana",28.30,77.24,28.48,77.38],
 ["delhi","New Delhi","Delhi",28.40,76.84,28.88,77.35],
 ["mumbai","Mumbai","Maharashtra",18.89,72.77,19.30,73.05],
 ["pune","Pune","Maharashtra",18.40,73.70,18.68,74.00],
 ["bengaluru","Bengaluru","Karnataka",12.80,77.45,13.15,77.80],
 ["hyderabad","Hyderabad","Telangana",17.25,78.30,17.60,78.65],
 ["chennai","Chennai","Tamil Nadu",12.85,80.10,13.25,80.32],
 ["kolkata","Kolkata","West Bengal",22.45,88.25,22.70,88.48],
 ["ahmedabad","Ahmedabad","Gujarat",22.93,72.48,23.14,72.70],
 ["jaipur","Jaipur","Rajasthan",26.78,75.68,27.02,75.92],
 ["chandigarh","Chandigarh","Chandigarh",30.64,76.68,30.80,76.88],
 ["lucknow","Lucknow","Uttar Pradesh",26.75,80.85,26.95,81.05],
 ["kochi","Kochi","Kerala",9.90,76.20,10.10,76.40],
 ["indore","Indore","Madhya Pradesh",22.62,75.78,22.80,75.95],
 ["dehradun","Dehradun","Uttarakhand",30.25,77.95,30.40,78.10]
];
const ENDPOINTS=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
const GEAR=/helmet|riding gear|rider gear|biker|moto ?gear|motorcycle gear|bike gear|riding jacket/i;

const args=process.argv.slice(2);const dry=args.includes("--dry");const only=args.filter(a=>!a.startsWith("--"));
const cities=only.length?CITIES.filter(c=>only.some(o=>c[0].includes(o.toLowerCase()))):CITIES;

function query([, , ,s,w,n,e]){
  const b=`(${s},${w},${n},${e})`;
  return `[out:json][timeout:180];(
nwr["shop"~"^(motorcycle|motorcycle_repair|motorcycle_parts)$"]${b};
nwr["craft"="motorcycle_repair"]${b};
nwr["shop"~"^(car_repair|tyres)$"]["motorcycle"~"yes|repair"]${b};
nwr["service:vehicle:motorcycle"="yes"]${b};
nwr["shop"]["name"~"helmet|riding gear|rider gear|biker|moto ?gear|motorcycle gear|bike gear",i]${b};
nwr["motorcycle:clothes"="yes"]${b};
);out center tags;`;
}

async function overpass(q){
  for(let attempt=0;attempt<6;attempt++){
    const url=ENDPOINTS[attempt%ENDPOINTS.length];
    try{
      const res=await fetch(url,{method:"POST",headers:{"User-Agent":"BikeHub-import/1.0 (bikehub listings)","Content-Type":"application/x-www-form-urlencoded"},body:"data="+encodeURIComponent(q)});
      if(res.ok)return (await res.json()).elements;
      console.warn(`  ${url} → HTTP ${res.status}, retrying`);
    }catch(err){console.warn(`  ${url} → ${err.message}, retrying`)}
    await new Promise(r=>setTimeout(r,10000*(attempt+1)));
  }
  throw new Error("Overpass unavailable after retries");
}

const slugify=s=>s.normalize("NFKD").replace(/[^\w\s-]/g,"").trim().toLowerCase().replace(/[\s_-]+/g,"-").slice(0,60);
const first=v=>v?.split(";")[0].trim()||null;

function classify(t){
  const name=t.name||"";
  if(t.shop==="motorcycle_parts")return ["gear_shop","Parts & accessories"];
  if(t["motorcycle:clothes"]==="yes"&&t.shop!=="motorcycle"||GEAR.test(name)&&t.shop!=="motorcycle_repair")return ["gear_shop","Riding gear & helmets"];
  if(t.shop==="motorcycle")return ["service_centre",t.brand?`${first(t.brand)} dealer & service centre`:"Motorcycle showroom & service"];
  if(t.shop==="tyres")return ["repair_shop","Tyre & wheel specialist"];
  return ["repair_shop","Two-wheeler repair workshop"];
}

function toRow(el,[,city,state]){
  const t=el.tags||{};
  if(!t.name)return null;
  const lat=el.lat??el.center?.lat,lon=el.lon??el.center?.lon;
  const [listing_type,centre_type]=classify(t);
  const id=`${el.type}/${el.id}`;
  const street=[t["addr:housenumber"],t["addr:street"]||t["addr:place"]].filter(Boolean).join(", ");
  const brands=[...new Set([t.brand,t["brand:en"]].filter(Boolean).flatMap(b=>b.split(";").map(x=>x.trim())))];
  return {
    source:"osm",source_id:id,slug:`${slugify(t.name)||"shop"}-${el.type[0]}${el.id}`,
    name:t.name.trim(),listing_type,centre_type,
    description:t.description||null,
    address_line:t["addr:full"]||street||null,
    locality:t["addr:suburb"]||t["addr:neighbourhood"]||t["addr:district"]||null,
    city,state,postal_code:t["addr:postcode"]||null,
    latitude:lat?Number(lat.toFixed(6)):null,longitude:lon?Number(lon.toFixed(6)):null,
    phone:first(t.phone||t["contact:phone"]||t["contact:mobile"]),
    email:first(t.email||t["contact:email"]),
    website:first(t.website||t["contact:website"]),
    opening_hours_text:t.opening_hours||null,
    brands,is_active:true,last_synced_at:new Date().toISOString()
  };
}

const supabase=dry?null:(()=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key){console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (or pass --dry).");process.exit(1)}
  return createClient(url,key,{auth:{persistSession:false}});
})();

// Partner-claimed listings are never overwritten by the import.
const claimed=new Set();
if(supabase){
  const {data,error}=await supabase.from("service_centres").select("source_id").eq("source","osm").not("owner_id","is",null);
  if(error){console.error(error.message);process.exit(1)}
  data.forEach(r=>claimed.add(r.source_id));
}

const seen=new Set();const totals={service_centre:0,repair_shop:0,gear_shop:0};
for(const c of cities){
  process.stdout.write(`${c[1]}: `);
  const rows=(await overpass(query(c))).map(el=>toRow(el,c)).filter(r=>r&&!seen.has(r.source_id)&&!claimed.has(r.source_id));
  rows.forEach(r=>{seen.add(r.source_id);totals[r.listing_type]++});
  if(supabase){
    for(let i=0;i<rows.length;i+=200){
      const {error}=await supabase.from("service_centres").upsert(rows.slice(i,i+200),{onConflict:"source,source_id"});
      if(error){console.error(`\n  upsert failed: ${error.message}`);process.exit(1)}
    }
  }
  console.log(`${rows.length} listings`);
  await new Promise(r=>setTimeout(r,3000));
}
console.log(`\nDone${dry?" (dry run)":""}: ${seen.size} listings —`,totals);
