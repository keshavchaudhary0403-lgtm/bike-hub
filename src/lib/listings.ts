// Shared listing types and helpers, safe to import from server and client components.
export type ListingType="service_centre"|"repair_shop"|"gear_shop";
export const LISTING_TYPES:{value:ListingType;label:string;plural:string}[]=[
 {value:"service_centre",label:"Service centre",plural:"Service centres"},
 {value:"repair_shop",label:"Repair shop",plural:"Repair shops"},
 {value:"gear_shop",label:"Gear & accessories",plural:"Gear & accessory shops"}
];
export const CITIES=["New Delhi","Noida","Gurugram","Ghaziabad","Faridabad","Mumbai","Pune","Bengaluru","Hyderabad","Chennai","Kolkata","Ahmedabad","Jaipur","Chandigarh","Lucknow","Kochi","Indore","Dehradun"];
/** City centres, for "near me" (nearest city) and distances when the rider only picks a city. */
export const CITY_COORDS:Record<string,{lat:number;lng:number}>={"New Delhi":{lat:28.6139,lng:77.209},Noida:{lat:28.5355,lng:77.391},Gurugram:{lat:28.4595,lng:77.0266},Ghaziabad:{lat:28.6692,lng:77.4538},Faridabad:{lat:28.4089,lng:77.3178},
 Mumbai:{lat:19.076,lng:72.8777},Pune:{lat:18.5204,lng:73.8567},Bengaluru:{lat:12.9716,lng:77.5946},Hyderabad:{lat:17.385,lng:78.4867},Chennai:{lat:13.0827,lng:80.2707},Kolkata:{lat:22.5726,lng:88.3639},
 Ahmedabad:{lat:23.0225,lng:72.5714},Jaipur:{lat:26.9124,lng:75.7873},Chandigarh:{lat:30.7333,lng:76.7794},Lucknow:{lat:26.8467,lng:80.9462},Kochi:{lat:9.9312,lng:76.2673},Indore:{lat:22.7196,lng:75.8577},Dehradun:{lat:30.3165,lng:78.0322}};
/** The listed city closest to a point, if it is within 60 km. */
export function nearestCity(o:{lat:number;lng:number}){
 let best:string|null=null;let d=1e9;
 for(const [city,c] of Object.entries(CITY_COORDS)){const x=Math.hypot(c.lat-o.lat,(c.lng-o.lng)*Math.cos(o.lat*Math.PI/180))*111;if(x<d){d=x;best=city}}
 return d<60?best:null;
}
const CITY_ALIASES:Record<string,string>={delhi:"New Delhi","new delhi":"New Delhi",gurgaon:"Gurugram",bangalore:"Bengaluru",bombay:"Mumbai",calcutta:"Kolkata",madras:"Chennai",cochin:"Kochi"};

export type Listing={slug:string;name:string;type:string;listingType:ListingType;location:string;image:string;tags:string[];official?:string|null;photo?:string|null;distance?:string|null;rating?:number;reviews?:number;phone?:string|null;open?:string|null};
export type ListingDetail=Listing&{id?:string;officialBrands:string[];skills:string[];description?:string|null;address?:string|null;locality?:string|null;city:string;state?:string|null;postalCode?:string|null;latitude?:number|null;longitude?:number|null;website?:string|null;email?:string|null;brands:string[];photos:string[];source:string;verification:string;sourceId?:string|null};

const IMAGES:Record<ListingType,string[]>={
 service_centre:["/images/service-centre-1.jpg","/images/service-centre-2.jpg","/images/service-centre-3.jpg","/images/service-centre-4.jpg"],
 repair_shop:["/images/workshop.jpg","/images/workshop-generated.jpg","/images/service-centre-3.jpg","/images/blog-preride-check.jpg"],
 gear_shop:["/images/blog-touring-kit.jpg","/images/rider-community.jpg","/images/rider-community-generated.jpg"]
};
export function listingImage(type:ListingType,slug:string){const list=IMAGES[type]||IMAGES.service_centre;let h=0;for(const ch of slug)h=(Math.imul(h,31)+ch.charCodeAt(0))>>>0;return list[h%list.length]}
export function typeLabel(type:string){return LISTING_TYPES.find(t=>t.value===type)?.label||"Service centre"}

/** Resolves free-text location input ("Noida Sector 62", "bangalore") to a known city. */
export function matchCity(input?:string){
 const v=input?.trim().toLowerCase();if(!v)return undefined;
 for(const [alias,city] of Object.entries(CITY_ALIASES))if(v.includes(alias))return city;
 return CITIES.find(c=>v.includes(c.toLowerCase()));
}
/** Infers a listing type from a search phrase such as "Riding gear fitting" or "Tyre change". */
export function inferType(q?:string):ListingType|undefined{
 const v=q?.toLowerCase()||"";
 if(/gear|helmet|accessor|jacket|glove|apparel|parts|upgrade/.test(v))return "gear_shop";
 if(/service/.test(v)&&/repair/.test(v))return undefined;
 if(/repair|mechanic|workshop|tyre|tire|wheel|puncture|garage|tuning|performance/.test(v))return "repair_shop";
 if(/service cent|showroom|dealer|authori[sz]ed/.test(v))return "service_centre";
 return undefined;
}
/** Public URL of a photo stored in the `listing-photos` bucket. */
export const photoUrl=(path:string)=>`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/${path}`;
export const googleMapsUrl=(l:{name:string;city:string;latitude?:number|null;longitude?:number|null})=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.name}, ${l.city}`)}`;
export const directionsUrl=(lat:number,lon:number)=>`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

/** "Official Honda service" for an authorised dealer. Text only: BikeHub does not show brand logos. */
export const officialLabel=(brands:string[]|null|undefined)=>brands?.length?`Official ${brands.join(" & ")} service`:null;
export function initials(name:string){return name.replace(/[^\p{L}\p{N}\s]/gu,"").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"BH"}
