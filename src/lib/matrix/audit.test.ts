import {describe,expect,it} from "vitest";
import {AUTO_GRANT,ITEMS,applyOverrides,grantCells,type Answers} from "./audit";

const has=(cells:ReturnType<typeof grantCells>,l:string,s:string)=>cells.find(c=>c.level===l&&c.service===s);

describe("audit auto-grant rules",()=>{
  it("only refers to checklist items that exist",()=>{
    const ids=new Set(ITEMS.map(i=>i.id));
    for(const r of AUTO_GRANT)for(const id of [...(r.needs||[]),...(r.anyOf||[]),...(r.brandsFrom?[r.brandsFrom]:[])])expect(ids.has(id),id).toBe(true);
  });
  it("grants nothing for an empty checklist",()=>{expect(grantCells({})).toEqual([])});
  it("grants big-bike electronics only with scanner, ABS bleeding and throttle sync, for the scanner's brands",()=>{
    const a:Answers={fi_scanner:true,"fi_scanner:brands":["Triumph","Kawasaki"],abs_bleeding:true};
    expect(has(grantCells(a),"L3","S3")).toBeUndefined();
    expect(has(grantCells({...a,throttle_sync:true}),"L3","S3")?.brands).toEqual(["Triumph","Kawasaki"]);
  });
  it("needs listed brands when a rule is brand-specific",()=>{
    expect(has(grantCells({fi_scanner:true,abs_bleeding:true,throttle_sync:true}),"L3","S3")).toBeUndefined();
  });
  it("requires electronics-safe washing for big bikes when the shop washes bikes",()=>{
    const base:Answers={covered_area:true,paddock_stands:true,hydraulic_lift:true};
    expect(has(grantCells(base),"L3","S1")).toBeTruthy();
    expect(has(grantCells({...base,wash_bay:true}),"L3","S1")).toBeUndefined();
    expect(has(grantCells({...base,wash_bay:true,safe_wash:true}),"L3","S1")).toBeTruthy();
  });
  it("needs experience for engine work",()=>{
    const a:Answers={engine_area:true,valve_tools:true,torque_wrench:true,senior_years:3};
    expect(has(grantCells(a),"L1","S4")).toBeUndefined();
    expect(has(grantCells({...a,senior_years:6}),"L1","S4")).toBeTruthy();
  });
  it("never auto-grants EV engine or performance work",()=>{
    const all:Answers=Object.fromEntries(ITEMS.map(i=>[i.id,true]));
    const cells=grantCells({...all,senior_years:20,"fi_scanner:brands":["KTM"],"dealer_software:brands":["BMW"]});
    expect(has(cells,"EV","S4")).toBeUndefined();expect(has(cells,"EV","S5")).toBeUndefined();
    expect(has(cells,"L4","S3")?.brands).toEqual(["BMW"]);
  });
  it("lets the auditor override with a note, and refuses without one",()=>{
    const granted=grantCells({covered_area:true});
    expect(applyOverrides(granted,[{level:"EV",service:"S4",grant:true,note:"Ultraviolette-trained technician seen"},{level:"L1",service:"S1",grant:false,note:"Work area floods in rain"}]).map(c=>`${c.level}${c.service}`)).toEqual(["EVS4"]);
    expect(()=>applyOverrides(granted,[{level:"L1",service:"S1",grant:false,note:""}])).toThrow(/needs a note/);
  });
});
