"use client";
import {useActionState,useState} from "react";
import {BIKE_BRANDS,modelsOf} from "@/data/bike-models";
import {BIKE_LEVELS,LEVEL_INFO,SERVICE_INFO,SERVICE_LEVELS} from "@/lib/matrix/config";
import {useRiderBike} from "@/lib/matrix/rider-bike";import {CheckCircle2,LoaderCircle,Send,Star} from "lucide-react";
import {submitComment,submitReview,submitStory,type FormState} from "@/lib/rider-actions";
import {POST_CATEGORIES} from "@/lib/community";

/** Hidden from people (and screen readers); bots that fill it are ignored. */
const Trap=()=><input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="trap"/>;
const Submit=({pending,label}:{pending:boolean;label:string})=><button className="button" disabled={pending}>{pending?<><LoaderCircle className="spin"/> Sending…</>:<>{label} <Send/></>}</button>;
const Done=({title,text}:{title:string;text:string})=><div className="success" role="status"><CheckCircle2/><h3>{title}</h3><p>{text}</p></div>;

export function ReviewForm({centreId,centreName}:{centreId:string;centreName:string}){
  const [state,action,pending]=useActionState<FormState,FormData>(submitReview,{ok:false});
  if(state.ok)return <Done title="Thanks for your review" text="It will appear here once our team has checked it, usually within a day."/>;
  return <form action={action} className="form"><input type="hidden" name="centre_id" value={centreId}/><Trap/>
    <fieldset className="star-input"><legend>Your rating of {centreName}</legend>{[5,4,3,2,1].map(n=><label key={n} title={`${n} star${n>1?"s":""}`}><input type="radio" name="rating" value={n} required/><Star aria-hidden="true"/><span className="sr-only">{n} star{n>1?"s":""}</span></label>)}</fieldset>
    <label>Your name<input name="name" required minLength={2} maxLength={80} autoComplete="name"/></label>
    <ReviewBike/>
    <label><span>What kind of job? <span className="optional">(optional)</span></span><select name="service_level" defaultValue=""><option value="">Not sure</option>{SERVICE_LEVELS.map(x=><option key={x} value={x}>{SERVICE_INFO[x].name}</option>)}</select></label>
    <label><span>What did you get done? <span className="optional">(optional)</span></span><input name="service" maxLength={120} placeholder="e.g. 10,000 km service, chain set"/></label>
    <label><span>Your review <span className="optional">(optional)</span></span><textarea name="body" maxLength={2000} placeholder="Work quality, price vs. estimate, time taken, how you were treated"/></label>
    {state.error&&<p className="form-error" role="alert">{state.error}</p>}<Submit pending={pending} label="Post review"/><small>No account needed. Reviews are checked before they appear.</small></form>;
}

/** Which bike the review is about: helps other riders with the same bike. Pre-filled with the bike remembered on this device. */
function ReviewBike(){
  const saved=useRiderBike();
  // Until the rider changes them, the selects show the bike remembered on this device.
  const [picked,setPicked]=useState<{brand:string;model:string}|null>(null);
  const brand=picked?.brand??saved?.brand??"";const model=picked?.model??(saved?.brand===brand?saved?.modelId??"":"");
  const setBrand=(b:string)=>setPicked({brand:b,model:""});const setModel=(m:string)=>setPicked({brand,model:m});
  const models=brand?modelsOf(brand):[];
  return <div className="form-row">
    <label><span>Your bike’s brand <span className="optional">(optional)</span></span><select value={brand} onChange={e=>setBrand(e.target.value)}><option value="">Choose brand</option>{BIKE_BRANDS.map(b=><option key={b}>{b}</option>)}</select></label>
    {brand?<label>Model<select name="bike_model" value={model} onChange={e=>setModel(e.target.value)}><option value="">Not listed / not sure</option>{models.map(m=><option key={m.id} value={m.id}>{m.model}</option>)}</select></label>
      :<label><span>Or bike type <span className="optional">(optional)</span></span><select name="bike_level" defaultValue=""><option value="">Not sure</option>{BIKE_LEVELS.map(l=><option key={l} value={l}>{LEVEL_INFO[l].name}</option>)}</select></label>}
  </div>;
}

export function CommentForm({postId}:{postId:string}){
  const [state,action,pending]=useActionState<FormState,FormData>(submitComment,{ok:false});
  if(state.ok)return <Done title="Comment received" text="Thanks! It will appear below once our team has checked it."/>;
  return <form action={action} className="form"><input type="hidden" name="post_id" value={postId}/><Trap/>
    <label>Your name<input name="name" required minLength={2} maxLength={80} autoComplete="name"/></label>
    <label>Comment<textarea name="body" required minLength={3} maxLength={2000} placeholder="Share a tip, a question or your own experience"/></label>
    {state.error&&<p className="form-error" role="alert">{state.error}</p>}<Submit pending={pending} label="Post comment"/><small>No account needed. Comments are checked before they appear.</small></form>;
}

export function StoryForm(){
  const [state,action,pending]=useActionState<FormState,FormData>(submitStory,{ok:false});
  if(state.ok)return <div className="panel"><Done title="Story received" text="Thank you! Our team will read it and email you before it’s published."/></div>;
  return <form action={action} className="panel form"><Trap/>
    <div className="form-row"><label>Your name<input name="name" required minLength={2} maxLength={80} autoComplete="name"/></label><label>Email<input name="email" type="email" required maxLength={120} autoComplete="email"/></label></div>
    <label>Title<input name="title" required minLength={5} maxLength={160} placeholder="e.g. Three days around the Nilgiris on a Himalayan"/></label>
    <label>Topic<select name="category" required defaultValue=""><option value="" disabled>Choose a topic</option>{POST_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>
    <label>Your story or tip<textarea name="body" required minLength={50} maxLength={20000} rows={12} placeholder="Leave a blank line between paragraphs."/></label>
    {state.error&&<p className="form-error" role="alert">{state.error}</p>}<Submit pending={pending} label="Send story"/><small>Your email is only used to contact you about this story, never shown publicly.</small></form>;
}
