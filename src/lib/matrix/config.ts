// Capability Matrix: the single source of truth for bike levels, service levels,
// verification statuses and the thresholds the matching code uses.
// Codes (L1, S3, …) are internal only. Riders only ever see the `name`/`line` copy below,
// which is kept here so a Hindi version can be added next to it later.

export const BIKE_LEVELS=["L1","L2","L3","L4","CLASSIC","EV"] as const;
export type BikeLevel=typeof BIKE_LEVELS[number];
export const SERVICE_LEVELS=["S1","S2","S3","S4","S5"] as const;
export type ServiceLevel=typeof SERVICE_LEVELS[number];
export const STATUSES=["claimed","visited","proven"] as const;
export type CellStatus=typeof STATUSES[number];

export const isBikeLevel=(v:unknown):v is BikeLevel=>(BIKE_LEVELS as readonly unknown[]).includes(v);
export const isServiceLevel=(v:unknown):v is ServiceLevel=>(SERVICE_LEVELS as readonly unknown[]).includes(v);
export const isStatus=(v:unknown):v is CellStatus=>(STATUSES as readonly unknown[]).includes(v);

/** L1–L4 form a ladder; CLASSIC and EV are separate specialty rows. */
export const LADDER:BikeLevel[]=["L1","L2","L3","L4"];

export const LEVEL_INFO:Record<BikeLevel,{name:string;handles:string;examples:string}>={
  L1:{name:"Performance bikes",handles:"performance bikes",examples:"Yamaha R15 & MT-15, TVS Apache RTR 160/200, Pulsar NS & N series, KTM 200 Duke, Suzuki Gixxer"},
  L2:{name:"Mid-weight & modern classics",handles:"mid-weight bikes",examples:"Royal Enfield 350s, Himalayan 450, KTM 390, Triumph Speed 400, Harley X440, Honda CB350, Jawa/Yezdi, Dominar"},
  L3:{name:"Big bikes",handles:"big bikes",examples:"Royal Enfield 650s, Kawasaki Ninja/Z 650, Honda CB650R, Triumph Trident 660, Suzuki V-Strom 800DE, BMW F 900"},
  L4:{name:"Superbikes & premium",handles:"superbikes",examples:"BMW R/S/M series, Ducati, Triumph 900cc+, Harley big twins, Kawasaki Z900 and up, Hayabusa, Africa Twin"},
  CLASSIC:{name:"Classic & vintage",handles:"classic & vintage bikes",examples:"Pre-2000, carburettor and 2-stroke bikes such as Yamaha RD350, old Bullets, old Jawa/Yezdi, Rajdoot"},
  EV:{name:"Electric performance",handles:"electric performance bikes",examples:"Ultraviolette and similar performance electric motorcycles"}
};

export const SERVICE_INFO:Record<ServiceLevel,{name:string;line:string;covers:string}>={
  S1:{name:"Routine care & washing",line:"Routine service & washing",covers:"Periodic service, oil & filter, chain care, brake pads, basic and foam wash"},
  S2:{name:"Repairs & replacements",line:"Repairs & replacements",covers:"Clutch, brakes, bearings, cables, battery, tyres, minor accident repair"},
  S3:{name:"Diagnostics & electronics",line:"Electronics & warning lights",covers:"Fuel-injection and ABS faults, warning lights, sensors, software updates, accessory wiring"},
  S4:{name:"Major mechanical",line:"Engine & gearbox work",covers:"Engine opening, valve work, gearbox, major crash repair"},
  S5:{name:"Performance & specialist",line:"Performance & tuning",covers:"Remaps, dyno, suspension setup, exhausts and performance parts, fabrication"}
};

/** How each status is shown to riders. */
export const STATUS_INFO:Record<CellStatus,{name:string;short:string;explain:string}>={
  proven:{name:"Proven",short:"✓ Proven",explain:"Checked by BikeHub and backed by at least 3 rider reviews for this kind of bike and job."},
  visited:{name:"Checked by BikeHub",short:"✓ Checked by BikeHub",explain:"A BikeHub team member visited and saw the tools, equipment and skills for this."},
  claimed:{name:"Shop says",short:"Shop says",explain:"The shop told us it does this. BikeHub has not checked it yet."}
};
export const STATUS_RANK:Record<CellStatus,number>={claimed:1,visited:2,proven:3};

/** The lowest status at which a cell is shown to riders as available.
 *  Partners may claim any cell; claimed cells below this stay "pending verification" for the partner and admin only. */
export const MIN_STATUS:Record<BikeLevel,Record<ServiceLevel,CellStatus>>={
  L1:{S1:"claimed",S2:"claimed",S3:"visited",S4:"visited",S5:"visited"},
  L2:{S1:"claimed",S2:"claimed",S3:"visited",S4:"visited",S5:"visited"},
  L3:{S1:"visited",S2:"visited",S3:"visited",S4:"visited",S5:"visited"},
  L4:{S1:"visited",S2:"visited",S3:"visited",S4:"visited",S5:"visited"},
  CLASSIC:{S1:"claimed",S2:"claimed",S3:"visited",S4:"visited",S5:"visited"},
  EV:{S1:"visited",S2:"visited",S3:"visited",S4:"visited",S5:"visited"}
};
/** True when a cell with this status may be shown to riders as available. */
export const meetsMinimum=(level:BikeLevel,service:ServiceLevel,status:CellStatus)=>STATUS_RANK[status]>=STATUS_RANK[MIN_STATUS[level][service]];
/** True when a partner's own claim is enough for riders to see the cell. */
export const claimIsEnough=(level:BikeLevel,service:ServiceLevel)=>MIN_STATUS[level][service]==="claimed";

/** Speciality tags on a shop, used by the "single-skill specialist" type and some intents. */
export const SKILLS=["tyres","brakes","suspension","paint","electrical","washing_detailing","fabrication","touring_kit"] as const;
export type Skill=typeof SKILLS[number];
export const isSkill=(v:unknown):v is Skill=>(SKILLS as readonly unknown[]).includes(v);
export const SKILL_INFO:Record<Skill,{name:string;specialist:string}>={
  tyres:{name:"Tyres & wheels",specialist:"Tyre specialist"},
  brakes:{name:"Brakes",specialist:"Brake specialist"},
  suspension:{name:"Suspension",specialist:"Suspension specialist"},
  paint:{name:"Paint & bodywork",specialist:"Paint & bodywork specialist"},
  electrical:{name:"Electrical & wiring",specialist:"Auto-electrical specialist"},
  washing_detailing:{name:"Washing & detailing",specialist:"Washing & detailing studio"},
  fabrication:{name:"Fabrication & custom work",specialist:"Custom fabrication specialist"},
  touring_kit:{name:"Touring kit fitting",specialist:"Touring kit specialist"}
};

/** Thresholds for deriveShopTypes(). */
export const SHOP_TYPE_RULES={
  /** Share of a shop's cells inside L1–L2 × S1–S2 for "Neighbourhood workshop". */
  neighbourhoodShare:0.7,
  /** Services an L3 or L4 row must cover for "Multi-brand big-bike workshop". */
  bigBikeServices:["S1","S2","S3","S4"] as ServiceLevel[],
  bigBikeMinBrands:2,
  /** Bike levels with S5 for "Performance specialist". */
  performanceMinLevels:2,
  /** CLASSIC services that count as restoration work. */
  classicServices:["S2","S3","S4","S5"] as ServiceLevel[]
};

/** Proven upgrade and downgrade, applied when a rider review is approved or removed. */
export const PROVEN_RULES={minReports:3,downgradeBelow:2.5};

/** Search radius for results, in km, when the rider shares their location. Widened once when nothing matches. */
export const RADIUS_KM={near:12,wide:40};
/** Cities searched together when nothing matches in the rider's own city. */
export const CITY_REGIONS:string[][]=[["New Delhi","Noida","Gurugram","Ghaziabad","Faridabad"],["Mumbai","Pune"]];
export const regionOf=(city:string)=>CITY_REGIONS.find(r=>r.includes(city))||[city];

/** Rider-facing card line for a cell, e.g. "✓ Handles big bikes" or "Shop says: services superbikes (not yet verified)". */
export function levelLine(level:BikeLevel,status:CellStatus){
  return status==="claimed"?`Shop says: services ${LEVEL_INFO[level].handles} (not yet verified)`:`✓ Handles ${LEVEL_INFO[level].handles}`;
}
export function serviceLine(service:ServiceLevel,status:CellStatus){
  return status==="claimed"?`Shop says: ${SERVICE_INFO[service].line.toLowerCase()} (not yet verified)`:`✓ ${SERVICE_INFO[service].line}`;
}
