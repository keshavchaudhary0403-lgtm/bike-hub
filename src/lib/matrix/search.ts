// Understands rider language in the search box: jobs and symptoms (English, Hindi and Hinglish), bike models,
// brands and places. A keyword table, no AI call. Add new phrases to SYNONYMS.
import {findBrandInText,findModelInText,normalize,type BikeModel} from "@/data/bike-models";
import {matchCity} from "@/lib/listings";
import type {Need} from "./intents";

/** Phrase (matched on whole words, after normalising) → the need it stands for. First match wins, so specific phrases go first. */
export const SYNONYMS:[phrases:string[],need:Need][]=[
  [["warning light","check engine","engine light","abs light","light jal rahi","light jal raha","batti jal rahi","malfunction light","error code","sensor"],{intent:"problem",symptom:"warning_light"}],
  [["won t start","wont start","not starting","no start","start nahi","start nahi ho rahi","start nahi hoti","self nahi","kick nahi","battery dead","dead battery"],{intent:"problem",symptom:"wont_start"}],
  [["oil leak","leaking oil","leak","oil tapak","tapak raha"],{intent:"problem",symptom:"oil_leak"}],
  [["chain noise","noise","sound","awaaz","awaz","khat khat","tick tick","rattle","knocking"],{intent:"problem",symptom:"noise"}],
  [["wobble","wobbling","pulling","vibration","shaking","handle hil"],{intent:"problem",symptom:"wobble"}],
  [["brake","brakes","brake pad","brake pads","brake nahi","abs bleed"],{intent:"problem",symptom:"brakes"}],
  [["accident","crash","fell","fall","gir gayi","gir gaya","dent","denting","denting painting","bodywork","fairing"],{intent:"accident",ride:"yes"}],
  [["tyre","tyres","tire","tires","tyre change","puncture","tubeless","wheel balancing","alignment"],{intent:"tyres"}],
  [["remap","remapping","ecu","dyno","tuning","exhaust","performance","suspension","revalve","quickshifter","power commander"],{intent:"perform"}],
  [["wash","washing","foam wash","bike wash","dhulai","dhona","detailing","ceramic","ppf","polish"],{intent:"service",option:"wash"}],
  [["oil change","engine oil","chain lube","chain clean","chain","lube"],{intent:"service",option:"oil"}],
  [["restore","restoration","vintage","classic restoration","purani bike"],{intent:"custom",option:"restore"}],
  [["custom","customise","customize","modification","modify","modified","fabrication","welding","bobber build"],{intent:"custom",option:"fabrication"}],
  [["trip","touring","tour","ride prep","pre trip","long ride","ladakh","spiti","saddle bags","crash guard","luggage"],{intent:"trip"}],
  [["helmet","helmets","jacket","riding jacket","gloves","riding boots","riding gear","gear shop","riding pants"],{intent:"gear"}],
  [["engine","overhaul","engine work","gearbox","clutch plate","valve","top overhaul","engine khulna","engine kholna"],{intent:"problem",service:"S4"}],
  [["service","servicing","service karwana","service karani","service krwana","periodic service","general service","maintenance","bike garage","garage","mistri","mechanic","workshop","service center","service centre"],{intent:"service",option:"full"}]
];
const NEAR_ME=["near me","nearby","nearest","close to me","mere paas","paas mein","aas paas","around me"];

export type Parsed={need:Need|null;model:BikeModel|null;brand:string|null;city:string|null;nearMe:boolean;gear:boolean;leftover:string};

const contains=(text:string,phrase:string)=>` ${text} `.includes(` ${normalize(phrase)} `);

/** Reads a free-text search such as "duke 390 service karwana noida" or "warning light near me". */
export function parseQuery(raw:string|null|undefined):Parsed{
  const text=normalize(raw||"");
  let rest=` ${text} `;const strip=(phrase:string)=>{rest=rest.replace(` ${normalize(phrase)} `," ")};
  const hit=SYNONYMS.find(([phrases])=>phrases.some(p=>contains(text,p)));
  let need=hit?{...hit[1]}:null;
  if(hit)for(const p of hit[0])if(contains(text,p))strip(p);
  const model=findModelInText(text);
  if(model)for(const a of model.aliases)strip(a);
  const brand=model?.brand??findBrandInText(text);
  const city=matchCity(text)||null;
  const nearMe=NEAR_ME.some(p=>contains(text,p));
  NEAR_ME.forEach(strip);
  if(city)strip(city);
  const gear=need?.intent==="gear";
  if(gear)need=null;
  return {need,model,brand,city,nearMe,gear,leftover:rest.trim().replace(/\s+/g," ")};
}
