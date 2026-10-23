// Adds AI-researched routes and articles to Supabase as DRAFTS for an admin to review in
// Admin → Routes / Articles. It can only insert drafts: it never publishes, edits or deletes.
// Usage: npm run content -- list                 (titles already on the site, to avoid duplicates)
//        npm run content -- add <file.json>      (add the drafts in a JSON file)
//        npm run content -- add <file.json> --dry (validate only, no writes)
// File format: {"routes":[{...}],"articles":[{...}]}; see .claude/skills/daily-content/SKILL.md.
import {readFileSync} from "node:fs";
import {createClient} from "@supabase/supabase-js";

try{process.loadEnvFile(".env.local")}catch{}

const CATEGORIES=["Ride story","Touring","Maintenance","Riding tips","Expert advice","Community"];
const LEVELS=["Beginner","Intermediate","Advanced"];
const IMAGE_HOSTS=/^https:\/\/(images\.unsplash\.com\/photo-|upload\.wikimedia\.org\/wikipedia\/commons\/)|^\/images\//;

const [command,file]=process.argv.slice(2).filter(a=>!a.startsWith("--"));const dry=process.argv.includes("--dry");
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
if(!url||!key){console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local");process.exit(1)}
const supabase=createClient(url,key,{auth:{persistSession:false}});

const slugify=s=>s.normalize("NFKD").replace(/[^\w\s-]/g,"").trim().toLowerCase().replace(/[\s_-]+/g,"-").slice(0,70);
const words=s=>String(s||"").split(/\s+/).filter(Boolean).length;

/** Problems with a set of sources: at least two, all real https links. */
function checkSources(sources,errors){
  if(!Array.isArray(sources)||sources.length<2)errors.push("needs at least 2 sources");
  for(const s of sources||[])if(!s?.label||!/^https:\/\/\S+$/.test(s?.url||""))errors.push(`bad source: ${JSON.stringify(s)}`);
}
function checkImage(image,errors){
  if(image&&!IMAGE_HOSTS.test(image))errors.push(`cover image must be from images.unsplash.com, upload.wikimedia.org/wikipedia/commons or /images/: ${image}`);
}
function validateRoute(r){
  const e=[];
  if(!r.name||r.name.length<4)e.push("name missing");
  if(!r.summary||r.summary.length<40||r.summary.length>300)e.push("summary must be 40–300 characters");
  if(words(r.description)<250)e.push(`description too short (${words(r.description)} words, need 250+)`);
  if(words(r.safety_notes)<40)e.push("safety_notes too short (need 40+ words)");
  if(r.distance_km!=null&&!(Number.isInteger(r.distance_km)&&r.distance_km>0&&r.distance_km<20000))e.push("distance_km must be a whole number of km");
  if(r.difficulty&&!LEVELS.includes(r.difficulty))e.push(`difficulty must be one of ${LEVELS.join(", ")}`);
  checkSources(r.sources,e);checkImage(r.hero_image_url,e);
  return e;
}
function validateArticle(a){
  const e=[];
  if(!a.title||a.title.length<10||a.title.length>110)e.push("title must be 10–110 characters");
  if(!CATEGORIES.includes(a.category))e.push(`category must be one of ${CATEGORIES.join(", ")}`);
  if(!a.excerpt||a.excerpt.length<60||a.excerpt.length>300)e.push("excerpt must be 60–300 characters");
  if(words(a.body)<400)e.push(`body too short (${words(a.body)} words, need 400+)`);
  checkSources(a.sources,e);checkImage(a.hero_image_url,e);
  return e;
}

/** A slug not already used in the table. */
async function freeSlug(table,base){
  const {data,error}=await supabase.from(table).select("slug").like("slug",`${base}%`);if(error)throw error;
  const taken=new Set(data.map(r=>r.slug));if(!taken.has(base))return base;
  for(let i=2;;i++)if(!taken.has(`${base}-${i}`))return `${base}-${i}`;
}

async function list(){
  const [{data:routes},{data:posts}]=await Promise.all([
    supabase.from("routes").select("name,slug,status,start_location,end_location").order("created_at"),
    supabase.from("posts").select("title,slug,category,status").order("created_at")]);
  console.log(`ROUTES (${routes.length})`);for(const r of routes)console.log(`  [${r.status}] ${r.name} (${[r.start_location,r.end_location].filter(Boolean).join(" → ")}) /routes/${r.slug}`);
  console.log(`ARTICLES (${posts.length})`);for(const p of posts)console.log(`  [${p.status}] ${p.title} · ${p.category} /community/${p.slug}`);
}

async function add(path){
  const input=JSON.parse(readFileSync(path,"utf8"));const routes=input.routes||[],articles=input.articles||[];
  let bad=0;
  for(const r of routes){const e=validateRoute(r);if(e.length){bad++;console.error(`✗ route "${r.name}": ${e.join("; ")}`)}}
  for(const a of articles){const e=validateArticle(a);if(e.length){bad++;console.error(`✗ article "${a.title}": ${e.join("; ")}`)}}
  if(bad){console.error(`\n${bad} item(s) need fixing. Nothing was saved.`);process.exit(1)}
  if(dry){console.log(`✓ ${routes.length} route(s) and ${articles.length} article(s) look good (dry run, nothing saved).`);return}
  const now=new Date().toISOString();
  for(const r of routes){
    const row={name:r.name,summary:r.summary,description:r.description,start_location:r.start_location||null,end_location:r.end_location||null,distance_km:r.distance_km??null,
      duration_text:r.duration_text||null,difficulty:r.difficulty||null,best_season:r.best_season||null,safety_notes:r.safety_notes,hero_image_url:r.hero_image_url||null,sources:r.sources,
      status:"draft",is_featured:false,updated_at:now,slug:await freeSlug("routes",slugify(r.slug||r.name))};
    const {data,error}=await supabase.from("routes").insert(row).select("id,slug").single();
    if(error){console.error(`✗ route "${r.name}": ${error.message}`);process.exitCode=1;continue}
    console.log(`✓ route draft: ${r.name} → Admin → Routes (/admin/routes/${data.id})`);
  }
  for(const a of articles){
    const row={title:a.title,category:a.category,excerpt:a.excerpt,body:a.body,author_name:a.author_name||"BikeHub Editorial",hero_image_url:a.hero_image_url||null,sources:a.sources,
      is_expert_content:Boolean(a.is_expert_content),status:"draft",published_at:null,updated_at:now,slug:await freeSlug("posts",slugify(a.slug||a.title))};
    const {data,error}=await supabase.from("posts").insert(row).select("id,slug").single();
    if(error){console.error(`✗ article "${a.title}": ${error.message}`);process.exitCode=1;continue}
    console.log(`✓ article draft: ${a.title} → Admin → Articles (/admin/articles/${data.id})`);
  }
}

if(command==="list")await list();
else if(command==="add"&&file)await add(file);
else{console.error("Usage: npm run content -- list | add <file.json> [--dry]");process.exit(1)}
