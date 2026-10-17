// Shared listing types and helpers, safe to import from server and client components.
export type ListingType="service_centre"|"repair_shop"|"gear_shop";
export const LISTING_TYPES:{value:ListingType;label:string;plural:string}[]=[
 {value:"service_centre",label:"Service centre",plural:"Service centres"},
 {value:"repair_shop",label:"Repair shop",plural:"Repair shops"},
 {value:"gear_shop",label:"Gear & accessories",plural:"Gear & accessory shops"}
];
export const CITIES=["New Delhi","Noida","Gurugram","Ghaziabad","Faridabad","Mumbai","Pune","Bengaluru","Hyderabad","Chennai","Kolkata","Ahmedabad","Jaipur","Chandigarh","Lucknow","Kochi","Indore","Dehradun"];
const CITY_ALIASES:Record<string,string>={delhi:"New Delhi","new delhi":"New Delhi",gurgaon:"Gurugram",bangalore:"Bengaluru",bombay:"Mumbai",calcutta:"Kolkata",madras:"Chennai",cochin:"Kochi"};

export type Listing={slug:string;name:string;type:string;listingType:ListingType;location:string;image:string;tags:string[];rating?:number;reviews?:number;phone?:string|null;open?:string|null};
export type ListingDetail=Listing&{id?:string;description?:string|null;address?:string|null;locality?:string|null;city:string;state?:string|null;postalCode?:string|null;latitude?:number|null;longitude?:number|null;website?:string|null;email?:string|null;brands:string[];source:string;verification:string;sourceId?:string|null};

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
export const googleMapsUrl=(l:{name:string;city:string;latitude?:number|null;longitude?:number|null})=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.name}, ${l.city}`)}`;
export const directionsUrl=(lat:number,lon:number)=>`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
