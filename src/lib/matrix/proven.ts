// Rider reviews and a cell's status: upgrade to proven, or downgrade on poor ratings.
import {PROVEN_RULES,type CellStatus} from "./config";

export type CellChange=null|"upgraded"|"downgraded"|"reverted";

/** The status a cell should have, given its current status and the ratings (1–5) of approved reviews
 *  for that shop, bike level and service level.
 *  - Only BikeHub can lift a claim: claimed cells stay claimed whatever the reviews say.
 *  - 3+ reviews averaging below 2.5 drop a checked cell back to claimed until BikeHub visits again (admin alert).
 *  - A visited cell with 3+ reviews becomes proven; a proven cell that falls under 3 reviews goes back to visited.
 *  Same input, same answer: running it twice changes nothing. */
export function evaluateCell(current:CellStatus,ratings:number[]):{status:CellStatus;change:CellChange}{
  if(current==="claimed")return {status:"claimed",change:null};
  const n=ratings.length;const avg=n?ratings.reduce((a,b)=>a+b,0)/n:0;
  if(n>=PROVEN_RULES.minReports&&avg<PROVEN_RULES.downgradeBelow)return {status:"claimed",change:"downgraded"};
  if(n>=PROVEN_RULES.minReports)return {status:"proven",change:current==="proven"?null:"upgraded"};
  return {status:"visited",change:current==="proven"?"reverted":null};
}
