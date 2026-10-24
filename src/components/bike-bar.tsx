"use client";
// "Your bike: Triumph Trident 660 · change", shown at the top of the services pages.
import Link from "next/link";import {usePathname,useSearchParams} from "next/navigation";import {Bike} from "lucide-react";
import {bikeToParams,useRiderBike} from "@/lib/matrix/rider-bike";

/** `label` is the bike the results were worked out for (from the address), if any. */
export function BikeBar({label}:{label?:string|null}){
  const path=usePathname();const search=useSearchParams();const saved=useRiderBike();
  const here=`${path}${search.size?`?${search}`:""}`;
  const change=`/find?step=bike&next=${encodeURIComponent(here)}`;
  if(label)return <p className="bike-bar"><Bike aria-hidden="true"/><span>Your bike: <b>{label}</b></span><Link href={change}>change</Link></p>;
  if(saved){
    const withBike=bikeToParams(saved,new URLSearchParams(search.toString()));
    // On a single listing the bike only highlights its row; on lists it narrows the results.
    return <p className="bike-bar"><Bike aria-hidden="true"/><span>Your bike: <b>{saved.name}</b></span>{path==="/services"&&<Link href={`/services?${withBike}`}>show matches for it</Link>}<Link href={change}>change</Link></p>;
  }
  return <p className="bike-bar muted"><Bike aria-hidden="true"/><span>Tell us your bike for better matches.</span><Link href={change}>Add your bike</Link></p>;
}
