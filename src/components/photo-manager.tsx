"use client";
import Image from "next/image";import {useRef,useState} from "react";import {ImagePlus,LoaderCircle,Star,Trash2} from "lucide-react";import {createClient} from "@/lib/supabase-browser";import {photoUrl} from "@/lib/listings";import {saveListingPhotos} from "@/app/partner/actions";
export const MAX_PHOTOS=8;
/** Phone photos are often 5–10 MB: scale to 1600px JPEG before upload. */
export async function shrink(file:File):Promise<Blob>{
  const bmp=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(bmp.width,bmp.height));
  const c=document.createElement("canvas");c.width=Math.round(bmp.width*scale);c.height=Math.round(bmp.height*scale);c.getContext("2d")!.drawImage(bmp,0,0,c.width,c.height);bmp.close();
  return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error("encode")),"image/jpeg",0.85));
}
/** Upload, reorder and delete a listing's photos. The first photo is the cover shown on cards and the listing page. */
export function PhotoManager({centreId,initial}:{centreId:string;initial:string[]}){
  const [photos,setPhotos]=useState(initial);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const input=useRef<HTMLInputElement>(null);
  async function commit(next:string[]){const r=await saveListingPhotos(centreId,next);if(r.error){setMessage(r.error);return false}setPhotos(next);return true}
  async function add(files:FileList|null){
    if(!files?.length)return;setBusy(true);setMessage("");const supabase=createClient();const added:string[]=[];
    try{
      for(const file of [...files].slice(0,MAX_PHOTOS-photos.length)){
        let blob:Blob;try{blob=await shrink(file)}catch{setMessage(`${file.name} couldn’t be read. Use a JPG or PNG photo.`);continue}
        const path=`${centreId}/${crypto.randomUUID()}.jpg`;
        const {error}=await supabase.storage.from("listing-photos").upload(path,blob,{contentType:"image/jpeg",cacheControl:"31536000"});
        if(error){setMessage(`Upload failed: ${error.message}`);continue}
        added.push(path);
      }
      if(added.length&&!(await commit([...photos,...added])))await supabase.storage.from("listing-photos").remove(added);
    }finally{setBusy(false);if(input.current)input.current.value=""}
  }
  async function remove(path:string){setBusy(true);setMessage("");if(await commit(photos.filter(p=>p!==path)))await createClient().storage.from("listing-photos").remove([path]);setBusy(false)}
  async function makeCover(path:string){setBusy(true);setMessage("");await commit([path,...photos.filter(p=>p!==path)]);setBusy(false)}
  return <div className="dash-card photo-manager"><div className="dash-card-head"><h2>Photos</h2><span className="muted">{photos.length}/{MAX_PHOTOS}</span></div>
    {photos.length?<ul className="photo-grid">{photos.map((p,i)=><li key={p} className={i===0?"cover":undefined}><Image src={photoUrl(p)} alt="" fill sizes="200px"/>{i===0&&<span className="chip">Cover</span>}
      <div className="photo-actions">{i>0&&<button type="button" className="icon-btn" onClick={()=>makeCover(p)} disabled={busy} title="Make cover photo" aria-label="Make cover photo"><Star/></button>}<button type="button" className="icon-btn" onClick={()=>remove(p)} disabled={busy} title="Delete photo" aria-label="Delete photo"><Trash2/></button></div></li>)}</ul>
    :<p className="hint">Listings with real photos get more enquiries. Add your shopfront, workshop and team.</p>}
    {photos.length<MAX_PHOTOS&&<label className={`button secondary photo-add${busy?" disabled":""}`}>{busy?<LoaderCircle className="spin"/>:<ImagePlus/>} {busy?"Working…":"Add photos"}<input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={busy} onChange={e=>add(e.target.files)}/></label>}
    {message&&<p className="form-error" role="alert">{message}</p>}
    <p className="hint">JPG, PNG or WebP. The first photo is the cover on your card and listing page.</p></div>;
}
