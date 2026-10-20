import Link from "next/link";import {ExternalLink,Save} from "lucide-react";import {VERIFICATION_STATUSES} from "@/lib/admin";import {CITIES,LISTING_TYPES} from "@/lib/listings";import {saveListing} from "@/app/admin/actions";import {PhotoManager} from "@/components/photo-manager";
export type ListingRow={id:string;slug:string;name:string;listing_type:string;centre_type:string|null;description:string|null;address_line:string|null;locality:string|null;city:string;state:string;postal_code:string|null;latitude:number|null;longitude:number|null;phone:string|null;email:string|null;website:string|null;opening_hours_text:string|null;brands:string[]|null;photos:string[]|null;verification_status:string;is_active:boolean;is_featured:boolean;source:string;source_id:string|null;manually_edited:boolean};
/** Admin editor for every listing field. Without `listing` it creates a new one. */
export function ListingForm({listing:l,ownerEmail}:{listing?:ListingRow;ownerEmail?:string|null}){
  return <form action={saveListing} className="editor">{l&&<input type="hidden" name="id" value={l.id}/>}<input type="hidden" name="current_owner" value={ownerEmail||""}/>
  <div className="editor-main">
    <fieldset className="dash-card" aria-label="Basics"><h2 className="span-2">Basics</h2>
      <label className="span-2">Business name<input name="name" required maxLength={120} defaultValue={l?.name}/></label>
      <label>Listing type<select name="listing_type" defaultValue={l?.listing_type||"service_centre"}>{LISTING_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
      <label>Subtitle<input name="centre_type" maxLength={120} defaultValue={l?.centre_type||""} placeholder="e.g. Royal Enfield dealer & service centre"/></label>
      <label className="span-2">Brands <span className="optional">Comma separated, e.g. Honda, KTM</span><input name="brands" defaultValue={l?.brands?.join(", ")||""}/></label>
      <label className="span-2">About<textarea name="description" maxLength={3000} defaultValue={l?.description||""} placeholder="What this business does, specialities, facilities"/></label>
    </fieldset>
    <fieldset className="dash-card" aria-label="Contact"><h2 className="span-2">Contact</h2>
      <label>Phone<input name="phone" inputMode="tel" maxLength={60} defaultValue={l?.phone||""}/></label>
      <label>Email<input name="email" type="email" maxLength={120} defaultValue={l?.email||""}/></label>
      <label>Website<input name="website" maxLength={200} defaultValue={l?.website||""} placeholder="https://"/></label>
      <label>Opening hours<input name="opening_hours_text" maxLength={200} defaultValue={l?.opening_hours_text||""} placeholder="Mo-Sa 10:00-20:00"/></label>
    </fieldset>
    <fieldset className="dash-card" aria-label="Location"><h2 className="span-2">Location</h2>
      <label className="span-2">Street address<input name="address_line" maxLength={300} defaultValue={l?.address_line||""}/></label>
      <label>Area / locality<input name="locality" maxLength={120} defaultValue={l?.locality||""}/></label>
      <label>City<input name="city" required list="admin-cities" maxLength={80} defaultValue={l?.city||""}/><datalist id="admin-cities">{CITIES.map(c=><option key={c} value={c}/>)}</datalist></label>
      <label>State<input name="state" required maxLength={80} defaultValue={l?.state||""}/></label>
      <label>PIN code<input name="postal_code" inputMode="numeric" maxLength={12} defaultValue={l?.postal_code||""}/></label>
      <label>Latitude<input name="latitude" inputMode="decimal" defaultValue={l?.latitude??""} placeholder="12.9716"/></label>
      <label>Longitude<input name="longitude" inputMode="decimal" defaultValue={l?.longitude??""} placeholder="77.5946"/></label>
      <p className="hint span-2">Tip: in Google Maps, right-click the shop’s location and click the coordinates to copy them.</p>
    </fieldset>
    {l?<PhotoManager centreId={l.id} initial={l.photos||[]}/>:<div className="dash-card"><h2>Photos</h2><p className="hint">Create the listing first, then add photos.</p></div>}
  </div>
  <aside className="editor-side">
    <div className="dash-card"><h2>Publishing</h2>
      <label className="switch"><input type="checkbox" name="is_active" defaultChecked={l?l.is_active:true}/><span>Visible on the website</span></label>
      <label className="switch"><input type="checkbox" name="is_featured" defaultChecked={l?.is_featured}/><span>Featured first in search</span></label>
      <label>Verification<select name="verification_status" defaultValue={l?.verification_status||"unverified"}>{VERIFICATION_STATUSES.map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}</select></label>
      <button className="button"><Save/> {l?"Save changes":"Create listing"}</button>
      {l?.is_active&&<Link className="button secondary" href={`/services/${l.slug}`} target="_blank"><ExternalLink/> View on site</Link>}
    </div>
    <div className="dash-card"><h2>Partner owner</h2><label>Owner’s login email<input name="owner_email" type="email" defaultValue={ownerEmail||""} placeholder="owner@business.in"/></label><p className="hint">The owner can then edit this listing and see its enquiries in their partner dashboard. They need a BikeHub account first. Leave empty to unlink.</p></div>
    {l&&<div className="dash-card"><h2>Source</h2><p className="hint">{l.source==="osm"?<>Imported from <a href={`https://www.openstreetmap.org/${l.source_id}`} target="_blank" rel="noreferrer">OpenStreetMap</a>. </>:"Added by BikeHub. "}{l.manually_edited?"Your edits are protected from future imports.":"Saving here protects it from future imports."}</p></div>}
  </aside></form>;
}
