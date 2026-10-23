"use client";
import Image from "next/image";import {useRef,useState} from "react";import {ImagePlus,LoaderCircle,Trash2} from "lucide-react";import {createClient} from "@/lib/supabase-browser";import {shrink} from "@/components/photo-manager";
/** Cover image for a route or article: uploads to the `content-images` bucket and submits the public URL with the form. */
export function ContentImageField({name,initial,folder}:{name:string;initial?:string|null;folder:"routes"|"articles"}){
  const [url,setUrl]=useState(initial||"");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const input=useRef<HTMLInputElement>(null);
  async function upload(file?:File){
    if(!file)return;setBusy(true);setMessage("");
    try{
      let blob:Blob;try{blob=await shrink(file)}catch{setMessage("That file couldn’t be read. Use a JPG or PNG photo.");return}
      const supabase=createClient();const path=`${folder}/${crypto.randomUUID()}.jpg`;
      const {error}=await supabase.storage.from("content-images").upload(path,blob,{contentType:"image/jpeg",cacheControl:"31536000"});
      if(error){setMessage(`Upload failed: ${error.message}`);return}
      setUrl(supabase.storage.from("content-images").getPublicUrl(path).data.publicUrl);
    }finally{setBusy(false);if(input.current)input.current.value=""}
  }
  return <div className="image-field"><input type="hidden" name={name} value={url}/>
    {url?<div className="image-field-preview"><Image src={url} alt="" fill sizes="320px"/></div>:<p className="hint">No image yet. A default photo is used until you add one.</p>}
    <div className="dash-actions"><label className={`button secondary small${busy?" disabled":""}`}>{busy?<LoaderCircle className="spin"/>:<ImagePlus/>} {busy?"Uploading…":url?"Replace image":"Upload image"}<input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy} onChange={e=>upload(e.target.files?.[0])}/></label>
      {url&&<button type="button" className="button secondary small" onClick={()=>setUrl("")} disabled={busy}><Trash2/> Remove</button>}</div>
    {message&&<p className="form-error" role="alert">{message}</p>}<p className="hint">Wide landscape photos work best. Remember to save.</p></div>;
}
