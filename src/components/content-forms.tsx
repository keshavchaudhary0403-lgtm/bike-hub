import Link from "next/link";import {ExternalLink,Save,Trash2} from "lucide-react";import {POST_CATEGORIES,ROUTE_LEVELS} from "@/lib/community";import {deletePost,deleteRoute,savePost,saveRoute} from "@/app/admin/content-actions";import {ContentImageField} from "@/components/content-image-field";

export type RouteRow={id:string;slug:string;name:string;summary:string|null;description:string|null;start_location:string|null;end_location:string|null;distance_km:number|null;duration_text:string|null;difficulty:string|null;best_season:string|null;safety_notes:string|null;hero_image_url:string|null;sources:{label:string;url:string}[]|null;status:string;is_featured:boolean};
export type PostRow={id:string;slug:string;title:string;category:string;excerpt:string|null;body:string;author_name:string|null;hero_image_url:string|null;sources:{label:string;url:string}[]|null;is_expert_content:boolean;status:string;published_at:string|null};

/** Delete behind a second click, so it can't happen by accident. */
function DangerZone({id,action,what}:{id:string;action:(form:FormData)=>Promise<void>;what:string}){
  return <details className="dash-card danger-zone"><summary>Delete this {what}</summary><p className="hint">This removes it from the website for good{what==="article"?", together with its comments":""}. To take it offline but keep it, turn off “Published” instead.</p>
    <form action={action}><input type="hidden" name="id" value={id}/><button className="button danger small"><Trash2/> Yes, delete {what}</button></form></details>;
}

export function RouteForm({route:r}:{route?:RouteRow}){
  return <><form action={saveRoute} className="editor">{r&&<input type="hidden" name="id" value={r.id}/>}
  <div className="editor-main">
    <fieldset className="dash-card" aria-label="Route"><h2 className="span-2">Route</h2>
      <label className="span-2">Name<input name="name" required maxLength={120} defaultValue={r?.name} placeholder="e.g. Delhi to Spiti"/></label>
      <label>Starts in<input name="start_location" maxLength={120} defaultValue={r?.start_location||""} placeholder="Delhi"/></label>
      <label>Ends in<input name="end_location" maxLength={120} defaultValue={r?.end_location||""} placeholder="Kaza"/></label>
      <label className="span-2">Short summary <span className="optional">Shown under the title</span><input name="summary" maxLength={300} defaultValue={r?.summary||""}/></label>
      <label className="span-2">About the route <span className="optional">Leave a blank line between paragraphs</span><textarea name="description" rows={8} maxLength={20000} defaultValue={r?.description||""} placeholder="The roads, highlights, where to stay, what makes it special"/></label>
      <label className="span-2">Before you go <span className="optional">Safety, permits, fuel and spares</span><textarea name="safety_notes" rows={5} maxLength={5000} defaultValue={r?.safety_notes||""}/></label>
      <label className="span-2">Sources <span className="optional">Where the facts were checked. One per line: Name | https://link</span><textarea name="sources" rows={3} defaultValue={(r?.sources||[]).map(x=>`${x.label} | ${x.url}`).join("\n")}/></label>
    </fieldset>
    <fieldset className="dash-card" aria-label="Facts"><h2 className="span-2">Quick facts</h2>
      <label>Distance (km)<input name="distance_km" inputMode="numeric" defaultValue={r?.distance_km??""} placeholder="760"/></label>
      <label>Suggested time<input name="duration_text" maxLength={60} defaultValue={r?.duration_text||""} placeholder="5–7 days"/></label>
      <label>Difficulty<select name="difficulty" defaultValue={r?.difficulty||""}><option value="">Not set</option>{ROUTE_LEVELS.map(l=><option key={l}>{l}</option>)}</select></label>
      <label>Best season<input name="best_season" maxLength={80} defaultValue={r?.best_season||""} placeholder="May to October"/></label>
    </fieldset>
  </div>
  <aside className="editor-side">
    <div className="dash-card"><h2>Publishing</h2>
      <label className="switch"><input type="checkbox" name="published" defaultChecked={r?r.status==="published":true}/><span>Published on the website</span></label>
      <label className="switch"><input type="checkbox" name="is_featured" defaultChecked={r?.is_featured}/><span>Show first</span></label>
      <button className="button"><Save/> {r?"Save changes":"Create route"}</button>
      {r?.status==="published"&&<Link className="button secondary" href={`/routes/${r.slug}`} target="_blank"><ExternalLink/> View on site</Link>}</div>
    <div className="dash-card"><h2>Cover photo</h2><ContentImageField name="hero_image_url" initial={r?.hero_image_url} folder="routes"/></div>
  </aside></form>
  {r&&<DangerZone id={r.id} action={deleteRoute} what="route"/>}</>;
}

export function ArticleForm({post:p}:{post?:PostRow}){
  return <><form action={savePost} className="editor">{p&&<input type="hidden" name="id" value={p.id}/>}
  <div className="editor-main">
    <fieldset className="dash-card" aria-label="Article"><h2 className="span-2">Article</h2>
      <label className="span-2">Title<input name="title" required maxLength={160} defaultValue={p?.title}/></label>
      <label>Category<select name="category" required defaultValue={p?.category||""}><option value="" disabled>Choose a category</option>{POST_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>
      <label>Author name<input name="author_name" maxLength={80} defaultValue={p?.author_name||""} placeholder="Team BikeHub"/></label>
      <label className="span-2">Intro <span className="optional">One or two sentences, shown on cards and at the top</span><textarea name="excerpt" rows={2} maxLength={300} defaultValue={p?.excerpt||""}/></label>
      <label className="span-2">Article text <span className="optional">Leave a blank line between paragraphs</span><textarea name="body" required rows={16} maxLength={50000} defaultValue={p?.body}/></label>
      <label className="span-2">Sources <span className="optional">One per line: Name | https://link</span><textarea name="sources" rows={3} defaultValue={(p?.sources||[]).map(s=>`${s.label} | ${s.url}`).join("\n")} placeholder="Royal Enfield owner’s manual | https://…"/></label>
    </fieldset>
  </div>
  <aside className="editor-side">
    <div className="dash-card"><h2>Publishing</h2>
      <label className="switch"><input type="checkbox" name="published" defaultChecked={p?p.status==="published":false}/><span>Published on the website</span></label>
      <label className="switch"><input type="checkbox" name="is_expert_content" defaultChecked={p?.is_expert_content}/><span>Show under Expert advice</span></label>
      <button className="button"><Save/> {p?"Save changes":"Create article"}</button>
      {p?.status==="published"&&<Link className="button secondary" href={`/community/${p.slug}`} target="_blank"><ExternalLink/> View on site</Link>}</div>
    <div className="dash-card"><h2>Cover photo</h2><ContentImageField name="hero_image_url" initial={p?.hero_image_url} folder="articles"/></div>
  </aside></form>
  {p&&<DangerZone id={p.id} action={deletePost} what="article"/>}</>;
}
