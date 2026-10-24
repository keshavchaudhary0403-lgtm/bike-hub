// Motorcycles riders can pick from, classified by MODEL (not engine size) into a bike level.
// This file is the reviewable source: `npm run bike-models:sql` turns it into the bike_models seed migration.
// `review: true` marks a classification the team should double-check before relying on it.
// Only models sold in India (now or recently), 150cc and up, plus well-known classics.
import type {BikeLevel} from "../lib/matrix/config";

export type Fuel="fi"|"carb"|"electric";
export type BikeModel={id:string;brand:string;model:string;variant:string|null;level:BikeLevel;cc:number|null;fuel:Fuel;brandTools:string[];current:boolean;years:string|null;aliases:string[];needsReview:boolean};
type Opts={variant?:string;fuel?:Fuel;current?:boolean;years?:string;aliases?:string[];review?:boolean;tools?:boolean};
type Row=[brand:string,model:string,level:BikeLevel,cc:number|null,opts?:Opts];

// Brands whose bikes need the maker's own diagnostic tools from the mid-weight level up.
const TOOL_BRANDS=new Set(["KTM","Husqvarna","BMW","Triumph","Ducati","Harley-Davidson","Kawasaki","Aprilia"]);
const old:Opts={fuel:"carb",current:false};

const ROWS:Row[]=[
  // Royal Enfield
  ["Royal Enfield","Hunter 350","L2",349],
  ["Royal Enfield","Classic 350","L2",349],
  ["Royal Enfield","Bullet 350","L2",349,{aliases:["bullet"]}],
  ["Royal Enfield","Meteor 350","L2",349],
  ["Royal Enfield","Goan Classic 350","L2",349],
  ["Royal Enfield","Himalayan 450","L2",452,{aliases:["himalayan","new himalayan"]}],
  ["Royal Enfield","Guerrilla 450","L2",452,{aliases:["guerrilla"]}],
  ["Royal Enfield","Scram 440","L2",443,{review:true}],
  ["Royal Enfield","Himalayan 411","L2",411,{current:false,years:"2016–2023",aliases:["old himalayan"]}],
  ["Royal Enfield","Scram 411","L2",411,{current:false,years:"2022–2024"}],
  ["Royal Enfield","Classic 500","L2",499,{current:false,years:"2009–2020",review:true}],
  ["Royal Enfield","Thunderbird 350X","L2",346,{current:false,years:"2018–2020",aliases:["thunderbird"]}],
  ["Royal Enfield","Interceptor 650","L3",648,{aliases:["interceptor","int 650"]}],
  ["Royal Enfield","Continental GT 650","L3",648,{aliases:["continental gt","gt 650","conti gt"]}],
  ["Royal Enfield","Super Meteor 650","L3",648,{aliases:["super meteor"]}],
  ["Royal Enfield","Shotgun 650","L3",648,{aliases:["shotgun"]}],
  ["Royal Enfield","Bear 650","L3",648],
  ["Royal Enfield","Classic 650","L3",648,{review:true}],
  // Bajaj
  ["Bajaj","Pulsar 150","L1",149,{review:true}],
  ["Bajaj","Pulsar NS160","L1",160,{aliases:["ns160","ns 160"]}],
  ["Bajaj","Pulsar NS200","L1",199,{aliases:["ns200","ns 200"]}],
  ["Bajaj","Pulsar N160","L1",165,{aliases:["n160"]}],
  ["Bajaj","Pulsar N250","L1",249,{aliases:["n250"]}],
  ["Bajaj","Pulsar 220F","L1",220,{aliases:["220f","pulsar 220"]}],
  ["Bajaj","Pulsar RS200","L1",199,{aliases:["rs200","rs 200"]}],
  ["Bajaj","Pulsar NS400Z","L2",373,{aliases:["ns400","ns400z"],review:true}],
  ["Bajaj","Avenger Cruise 220","L1",220,{aliases:["avenger"],review:true}],
  ["Bajaj","Dominar 250","L2",249],
  ["Bajaj","Dominar 400","L2",373,{aliases:["dominar"]}],
  // TVS
  ["TVS","Apache RTR 160","L1",160,{aliases:["rtr 160","apache 160"]}],
  ["TVS","Apache RTR 160 4V","L1",160,{aliases:["rtr 160 4v","apache 4v"]}],
  ["TVS","Apache RTR 200 4V","L1",198,{aliases:["rtr 200","apache 200"]}],
  ["TVS","Ronin","L1",226,{review:true}],
  ["TVS","Apache RR 310","L2",312,{aliases:["rr310","rr 310"],review:true}],
  ["TVS","Apache RTR 310","L2",312,{aliases:["rtr 310"],review:true}],
  // Hero
  ["Hero","Xtreme 160R","L1",163,{aliases:["xtreme 160"]}],
  ["Hero","Xtreme 160R 4V","L1",163],
  ["Hero","Xtreme 200S","L1",199,{aliases:["xtreme 200"]}],
  ["Hero","Xpulse 200 4V","L1",199,{aliases:["xpulse","xpulse 200"],review:true}],
  ["Hero","Karizma XMR","L1",210,{aliases:["karizma"],review:true}],
  ["Hero","Xtreme 250R","L1",250,{review:true}],
  ["Hero","Mavrick 440","L2",440,{aliases:["mavrick"]}],
  // Harley-Davidson
  ["Harley-Davidson","X440","L2",440,{aliases:["x 440","harley 440"]}],
  ["Harley-Davidson","Street 750","L3",749,{current:false,years:"2014–2020",review:true}],
  ["Harley-Davidson","Iron 883","L4",883,{current:false,years:"2010–2020",review:true}],
  ["Harley-Davidson","Nightster","L4",975],
  ["Harley-Davidson","Sportster S","L4",1252],
  ["Harley-Davidson","Pan America 1250 Special","L4",1252,{aliases:["pan america"]}],
  ["Harley-Davidson","Fat Boy 114","L4",1868,{aliases:["fat boy","fatboy"]}],
  ["Harley-Davidson","Street Bob","L4",1868],
  ["Harley-Davidson","Heritage Classic","L4",1868],
  ["Harley-Davidson","Road Glide","L4",1923],
  ["Harley-Davidson","Street Glide","L4",1923],
  // Yamaha
  ["Yamaha","R15 V4","L1",155,{aliases:["r15","r 15"]}],
  ["Yamaha","MT-15 V2","L1",155,{aliases:["mt15","mt 15","mt-15"]}],
  ["Yamaha","FZ-S Fi","L1",149,{aliases:["fz","fzs"],review:true}],
  ["Yamaha","FZ-X","L1",149,{aliases:["fzx"],review:true}],
  ["Yamaha","R3","L2",321,{aliases:["r 3","yzf r3"],review:true}],
  ["Yamaha","MT-03","L2",321,{aliases:["mt03","mt 03"],review:true}],
  // Honda
  ["Honda","Hornet 2.0","L1",184,{aliases:["hornet"]}],
  ["Honda","SP160","L1",162,{review:true}],
  ["Honda","Unicorn","L1",162,{review:true}],
  ["Honda","H'ness CB350","L2",348,{aliases:["hness","highness"]}],
  ["Honda","CB350","L2",348],
  ["Honda","CB350RS","L2",348,{aliases:["cb 350rs"]}],
  ["Honda","CB300F","L2",293,{review:true}],
  ["Honda","CB300R","L2",286],
  ["Honda","NX500","L2",471,{review:true}],
  ["Honda","CB650R","L3",649,{aliases:["cb 650r"]}],
  ["Honda","CBR650R","L3",649,{aliases:["cbr 650r","cbr650"]}],
  ["Honda","XL750 Transalp","L3",755,{aliases:["transalp"],review:true}],
  ["Honda","Africa Twin","L4",1084,{aliases:["africa twin","crf1100l"]}],
  ["Honda","CBR1000RR-R Fireblade","L4",999,{aliases:["fireblade"]}],
  ["Honda","Gold Wing","L4",1833,{aliases:["goldwing"]}],
  // Suzuki
  ["Suzuki","Gixxer","L1",155],
  ["Suzuki","Gixxer SF","L1",155],
  ["Suzuki","Gixxer 250","L1",249],
  ["Suzuki","Gixxer SF 250","L1",249],
  ["Suzuki","V-Strom SX","L1",249,{review:true}],
  ["Suzuki","V-Strom 800DE","L3",776,{aliases:["vstrom 800","v strom 800"]}],
  ["Suzuki","GSX-8R","L3",776,{aliases:["gsx 8r"]}],
  ["Suzuki","Katana","L4",999,{review:true}],
  ["Suzuki","Hayabusa","L4",1340,{aliases:["busa"]}],
  // KTM
  ["KTM","200 Duke","L1",199,{aliases:["duke 200"]}],
  ["KTM","RC 200","L1",199,{aliases:["rc200"]}],
  ["KTM","250 Duke","L2",249,{aliases:["duke 250"]}],
  ["KTM","390 Duke","L2",399,{aliases:["duke 390"]}],
  ["KTM","RC 390","L2",373,{aliases:["rc390"]}],
  ["KTM","250 Adventure","L2",249,{aliases:["250 adv"]}],
  ["KTM","390 Adventure","L2",399,{aliases:["390 adv","adventure 390"]}],
  ["KTM","390 Enduro R","L2",399,{review:true}],
  ["KTM","890 Adventure R","L4",889,{review:true}],
  ["KTM","1390 Super Duke R","L4",1350,{aliases:["super duke"],review:true}],
  // Husqvarna
  ["Husqvarna","Svartpilen 401","L2",399,{aliases:["svartpilen"]}],
  ["Husqvarna","Vitpilen 250","L2",249,{aliases:["vitpilen"]}],
  // Triumph
  ["Triumph","Speed 400","L2",398],
  ["Triumph","Scrambler 400 X","L2",398,{aliases:["scrambler 400"]}],
  ["Triumph","Thruxton 400","L2",398,{review:true}],
  ["Triumph","Trident 660","L3",660,{aliases:["trident"]}],
  ["Triumph","Tiger Sport 660","L3",660],
  ["Triumph","Daytona 660","L3",660],
  ["Triumph","Street Triple 765","L3",765,{aliases:["street triple"],review:true}],
  ["Triumph","Speed Twin 900","L4",900],
  ["Triumph","Bonneville T100","L4",900],
  ["Triumph","Scrambler 900","L4",900],
  ["Triumph","Tiger 900","L4",888],
  ["Triumph","Bonneville T120","L4",1200],
  ["Triumph","Speed Twin 1200","L4",1200],
  ["Triumph","Speed Triple 1200 RS","L4",1160,{aliases:["speed triple"]}],
  ["Triumph","Tiger 1200","L4",1160],
  ["Triumph","Rocket 3","L4",2458],
  // BMW
  ["BMW","G 310 R","L2",313,{aliases:["g310r","g310"]}],
  ["BMW","G 310 GS","L2",313,{aliases:["g310gs"]}],
  ["BMW","G 310 RR","L2",312,{aliases:["g310rr"]}],
  ["BMW","F 900 R","L3",895],
  ["BMW","F 900 XR","L3",895],
  ["BMW","F 900 GS","L3",895],
  ["BMW","F 850 GS","L3",853,{current:false,years:"2018–2023"}],
  ["BMW","R 1250 GS","L4",1254,{current:false,years:"2019–2023"}],
  ["BMW","R 1300 GS","L4",1300,{aliases:["r1300gs","1300 gs"]}],
  ["BMW","R 12 nineT","L4",1170,{aliases:["nine t","ninet"]}],
  ["BMW","R 18","L4",1802],
  ["BMW","S 1000 R","L4",999],
  ["BMW","S 1000 RR","L4",999,{aliases:["s1000rr"]}],
  ["BMW","M 1000 RR","L4",999],
  ["BMW","K 1600 GTL","L4",1649],
  // Kawasaki
  ["Kawasaki","KLX 230","L1",233,{review:true}],
  ["Kawasaki","Ninja 300","L2",296],
  ["Kawasaki","Ninja 500","L2",451],
  ["Kawasaki","Eliminator","L2",451,{review:true}],
  ["Kawasaki","Ninja 650","L3",649],
  ["Kawasaki","Z650","L3",649,{aliases:["z 650"]}],
  ["Kawasaki","Z650RS","L3",649],
  ["Kawasaki","Versys 650","L3",649],
  ["Kawasaki","Vulcan S","L3",649],
  ["Kawasaki","Ninja ZX-6R","L4",636,{aliases:["zx6r"],review:true}],
  ["Kawasaki","Z900","L4",948,{aliases:["z 900"]}],
  ["Kawasaki","Ninja 1100SX","L4",1099],
  ["Kawasaki","Ninja ZX-10R","L4",998,{aliases:["zx10r"]}],
  ["Kawasaki","Ninja H2","L4",998],
  // Ducati (all superbike/premium level)
  ["Ducati","Scrambler Icon","L4",803],
  ["Ducati","Monster","L4",937],
  ["Ducati","Hypermotard 950","L4",937],
  ["Ducati","DesertX","L4",937],
  ["Ducati","Multistrada V2","L4",937],
  ["Ducati","Panigale V2","L4",955],
  ["Ducati","Multistrada V4","L4",1158],
  ["Ducati","Streetfighter V4","L4",1103],
  ["Ducati","Panigale V4","L4",1103],
  ["Ducati","Diavel V4","L4",1158],
  // Jawa, Yezdi, BSA (Classic Legends)
  ["Jawa","Jawa 350","L2",334],
  ["Jawa","42","L2",294,{aliases:["jawa 42"]}],
  ["Jawa","42 Bobber","L2",334],
  ["Jawa","Perak","L2",334],
  ["Yezdi","Roadster","L2",334],
  ["Yezdi","Scrambler","L2",334],
  ["Yezdi","Adventure","L2",334],
  ["BSA","Gold Star 650","L3",652],
  // Aprilia
  ["Aprilia","RS 457","L2",457,{review:true}],
  ["Aprilia","Tuono 457","L2",457,{review:true}],
  // Electric performance
  ["Ultraviolette","F77 Mach 2","EV",null,{fuel:"electric",aliases:["f77"]}],
  ["Ultraviolette","F77 SuperStreet","EV",null,{fuel:"electric"}],
  // Classic & vintage (pre-2000, carburettor and 2-stroke)
  ["Yamaha","RD350","CLASSIC",347,{...old,years:"1983–1990",aliases:["rd 350"]}],
  ["Rajdoot","350","CLASSIC",347,{...old,years:"1983–1990",aliases:["rajdoot 350"]}],
  ["Rajdoot","175","CLASSIC",173,{...old,years:"1962–2005",aliases:["rajdoot"],review:true}],
  ["Yamaha","RX100","CLASSIC",98,{...old,years:"1985–1996",aliases:["rx 100"],review:true}],
  ["Yamaha","RX135","CLASSIC",132,{...old,years:"1997–2005",aliases:["rx 135"],review:true}],
  ["Royal Enfield","Bullet 350 (old, cast iron)","CLASSIC",346,{...old,years:"before 2000",aliases:["old bullet","cast iron bullet"]}],
  ["Royal Enfield","Bullet 500 (old)","CLASSIC",499,{...old,years:"before 2000"}],
  ["Jawa","250 (old)","CLASSIC",250,{...old,years:"1960–1996",aliases:["old jawa"]}],
  ["Yezdi","Roadking (old)","CLASSIC",250,{...old,years:"1978–1996",aliases:["roadking","road king"]}],
  ["Yezdi","Classic (old)","CLASSIC",250,{...old,years:"1978–1996",aliases:["old yezdi"]}],
  ["Hero Honda","CBZ (old)","CLASSIC",156,{...old,years:"1999–2005",aliases:["cbz"],review:true}],
  ["Suzuki","Shogun","CLASSIC",108,{...old,years:"1994–1999",review:true}]
];

const slug=(s:string)=>s.normalize("NFKD").toLowerCase().replace(/[()']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
/** Lower-case, punctuation-free form used for matching rider text ("Duke-390" → "duke 390"). */
export const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();

export const BIKE_MODELS:BikeModel[]=ROWS.map(([brand,model,level,cc,o={}])=>({
  id:slug(`${brand} ${model}`),brand,model,variant:o.variant??null,level,cc,fuel:o.fuel??"fi",
  brandTools:o.tools===false?[]:(level==="L3"||level==="L4"||(level!=="CLASSIC"&&level!=="L1"&&TOOL_BRANDS.has(brand)))?[brand]:[],
  current:o.current??true,years:o.years??null,aliases:[normalize(model),...(o.aliases||[]).map(normalize)],needsReview:o.review??false
}));

export const BIKE_BRANDS=[...new Set(BIKE_MODELS.map(m=>m.brand))].sort();
export const bikeModel=(id:string|null|undefined)=>id?BIKE_MODELS.find(m=>m.id===id)||null:null;
export const modelsOf=(brand:string)=>BIKE_MODELS.filter(m=>m.brand===brand);
export const bikeName=(m:Pick<BikeModel,"brand"|"model">)=>`${m.brand} ${m.model}`;

/** Approximate size buckets for riders who don't know their exact model. */
export const SIZE_BUCKETS=[
  {id:"small",label:"Up to 250cc",min:0,max:260},
  {id:"mid",label:"About 300–500cc",min:261,max:500},
  {id:"big",label:"About 600–800cc",min:501,max:850},
  {id:"huge",label:"Over 800cc",min:851,max:99999},
  {id:"old",label:"Old bike (before 2000, carburettor or 2-stroke)",min:0,max:0},
  {id:"electric",label:"Electric",min:0,max:0}
] as const;
export type SizeBucket=typeof SIZE_BUCKETS[number]["id"];
const BUCKET_DEFAULT:Record<SizeBucket,BikeLevel>={small:"L1",mid:"L2",big:"L3",huge:"L4",old:"CLASSIC",electric:"EV"};

/** Most likely bike level for a brand and an approximate size: the most common level among that brand's current models of that size. */
export function levelForSize(brand:string,bucket:SizeBucket):BikeLevel{
  if(bucket==="old")return "CLASSIC";if(bucket==="electric")return "EV";
  const b=SIZE_BUCKETS.find(x=>x.id===bucket)!;
  const counts=new Map<BikeLevel,number>();
  for(const m of BIKE_MODELS)if(m.brand===brand&&m.current&&m.cc!=null&&m.cc>=b.min&&m.cc<=b.max&&m.level!=="CLASSIC")counts.set(m.level,(counts.get(m.level)||0)+1);
  let best:BikeLevel=BUCKET_DEFAULT[bucket];let n=0;
  for(const [level,c] of counts)if(c>n){best=level;n=c}
  return best;
}

/** Finds a model mentioned in free text ("duke 390 service", "my himalayan"). Longest alias wins; current models win ties. */
export function findModelInText(text:string):BikeModel|null{
  const t=` ${normalize(text)} `;let best:BikeModel|null=null;let bestLen=0;
  for(const m of BIKE_MODELS)for(const a of m.aliases){
    if(a.length<3||!t.includes(` ${a} `))continue;
    if(a.length>bestLen||(a.length===bestLen&&m.current&&!best?.current)){best=m;bestLen=a.length}
  }
  return best;
}
/** Finds a brand mentioned in free text. */
export function findBrandInText(text:string):string|null{
  const t=` ${normalize(text)} `;
  const alias:Record<string,string>={"re":"Royal Enfield","enfield":"Royal Enfield","royal enfield":"Royal Enfield","harley":"Harley-Davidson","harley davidson":"Harley-Davidson","hd":"Harley-Davidson"};
  for(const [a,b] of Object.entries(alias))if(t.includes(` ${a} `))return b;
  return BIKE_BRANDS.find(b=>t.includes(` ${normalize(b)} `))||null;
}
