"use client";
import "leaflet/dist/leaflet.css";
import {useEffect,useRef,useState} from "react";import {LocateFixed} from "lucide-react";
import type {Map as LeafletMap} from "leaflet";
import type {MapPoint} from "@/lib/supabase-data";
import {typeLabel} from "@/lib/listings";

// Marker colours per listing type; match the legend below the map.
const COLOURS={service_centre:"#ff5a1f",repair_shop:"#16181c",gear_shop:"#d18a00"};
const INDIA:[[number,number],[number,number]]=[[8,68],[33,92]];
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);

/** OpenStreetMap map of listings. Leaflet touches `window`, so it loads only in the browser. */
export function ListingsMap({points}:{points:MapPoint[]}){
  const el=useRef<HTMLDivElement>(null);const map=useRef<LeafletMap|null>(null);const [locating,setLocating]=useState(false);const [error,setError]=useState("");
  useEffect(()=>{
    let cancelled=false;
    import("leaflet").then(L=>{
      if(cancelled||!el.current)return;
      const m=L.map(el.current,{scrollWheelZoom:false,preferCanvas:true});map.current=m;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(m);
      for(const p of points){
        const rating=p.rating!=null?`<br><span class="map-rating">★ ${p.rating.toFixed(1)}</span>`:"";
        L.circleMarker([p.lat,p.lng],{radius:7,weight:2,color:"#fff",fillColor:COLOURS[p.listingType]||COLOURS.service_centre,fillOpacity:.95})
          .bindPopup(`<a class="map-popup" href="/services/${encodeURIComponent(p.slug)}"><b>${escape(p.name)}</b><span>${escape(typeLabel(p.listingType))} · ${escape(p.location)}</span>${rating}<em>View details →</em></a>`)
          .addTo(m);
      }
      if(points.length)m.fitBounds(L.latLngBounds(points.map(p=>[p.lat,p.lng])),{padding:[30,30],maxZoom:15});else m.fitBounds(INDIA);
      m.on("locationfound",e=>{setLocating(false);L.circle(e.latlng,{radius:e.accuracy,color:"#2563eb",weight:1,fillOpacity:.12}).addTo(m)});
      m.on("locationerror",()=>{setLocating(false);setError("We couldn’t get your location. Check that location access is allowed.")});
    });
    return ()=>{cancelled=true;map.current?.remove();map.current=null};
  },[points]);
  function nearMe(){if(!map.current)return;setError("");setLocating(true);map.current.locate({setView:true,maxZoom:14})}
  return <div className="listings-map">
    <div ref={el} className="map-canvas" role="region" aria-label="Map of listings"/>
    <button type="button" className="button small map-locate" onClick={nearMe} disabled={locating}><LocateFixed/> {locating?"Finding you…":"Near me"}</button>
    <div className="map-legend">{Object.entries(COLOURS).map(([type,colour])=><span key={type}><i style={{background:colour}}/>{typeLabel(type)}</span>)}</div>
    {error&&<p className="form-error" role="alert">{error}</p>}
  </div>;
}
