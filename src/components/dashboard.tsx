import Link from "next/link";import {LayoutDashboard,Store,Inbox,Mail,LogOut,Plus,ShieldCheck,Building2,Route,FileText,ClipboardCheck} from "lucide-react";import {signOut} from "@/app/partner/actions";
type NavKey="overview"|"listings"|"enquiries"|"messages"|"routes"|"articles"|"approvals"|"partner";
type NavItem=[NavKey,string,string,typeof Store];
const ADMIN_NAV:NavItem[]=[["overview","/admin","Overview",LayoutDashboard],["listings","/admin/listings","Listings",Store],["enquiries","/admin/enquiries","Enquiries",Inbox],["messages","/admin/messages","Messages",Mail],["approvals","/admin/approvals","Approvals",ClipboardCheck],["routes","/admin/routes","Routes",Route],["articles","/admin/articles","Articles",FileText]];
const PARTNER_NAV:NavItem[]=[["partner","/partner/dashboard","Overview",LayoutDashboard],["enquiries","/partner/dashboard#enquiries","Enquiries",Inbox],["listings","/partner/dashboard#profile","My listing",Building2]];

/** Admin ↔ Partner switch, shown only to staff. */
function WorkspaceSwitch({area}:{area:"admin"|"partner"}){
  return <nav className="ws-switch" aria-label="Switch workspace"><Link href="/admin" className={area==="admin"?"on":undefined} aria-current={area==="admin"?"page":undefined}><ShieldCheck/> Admin</Link><Link href="/partner/dashboard" className={area==="partner"?"on":undefined} aria-current={area==="partner"?"page":undefined}><Store/> Partner</Link></nav>;
}

/** App-style layout for the admin and partner workspaces, both with the same dark sidebar.
 *  `canSwitch` (staff only) adds the workspace switch. */
export function DashShell({area,active,title,subtitle,actions,badges,canSwitch,children}:{area:"admin"|"partner";active:NavKey;title:string;subtitle?:string;actions?:React.ReactNode;badges?:Partial<Record<NavKey,number>>;canSwitch?:boolean;children:React.ReactNode}){
  const admin=area==="admin";const nav=admin?ADMIN_NAV:PARTNER_NAV;
  return <main className={`dash dash-${area}`}><div className="container dash-layout"><aside className={`dash-nav ${area}`}>
    {(canSwitch||admin)&&<WorkspaceSwitch area={area}/>}
    <p className="dash-area">{admin?<><ShieldCheck/> Admin workspace</>:<><Store/> Partner workspace</>}</p>
    <nav>{nav.map(([key,href,label,Icon])=><Link key={key+href} href={href} className={active===key?"active":undefined}><Icon/><span>{label}</span>{badges?.[key]?<em>{badges[key]}</em>:null}</Link>)}</nav>
    {admin&&<Link className="button small dash-new" href="/admin/listings/new"><Plus/> New listing</Link>}
    <form action={signOut}><button className="dash-signout"><LogOut/> Sign out</button></form></aside>
  <section className="dash-main">
    <header className="dash-head"><div><span className="dash-kicker">{admin?"Admin":"Partner"}</span><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{actions&&<div className="dash-actions">{actions}</div>}</header>{children}</section></div></main>;
}
const TONES:Record<string,string>={new:"blue",pending:"amber",accepted:"amber",quoted:"amber",verified:"green",closed:"green",read:"grey",unverified:"grey",declined:"grey",rejected:"red",suspended:"red",hidden:"red",live:"green",draft:"amber",published:"green",archived:"grey"};
export function Pill({value,label}:{value:string;label?:string}){return <span className={`pill-status ${TONES[value]||"grey"}`}>{label||value}</span>}
export function Stat({label,value,href,tone}:{label:string;value:number|string;href?:string;tone?:string}){const body=<><span>{label}</span><b>{typeof value==="number"?value.toLocaleString("en-IN"):value}</b></>;return href?<Link className={`stat ${tone||""}`} href={href}>{body}</Link>:<div className={`stat ${tone||""}`}>{body}</div>}
export function Flash({saved,error}:{saved?:string;error?:string}){if(error)return <p className="flash error" role="alert">{error}</p>;if(saved)return <p className="flash ok" role="status">Changes saved.</p>;return null}
/** Shown the moment a dashboard link is clicked, while the page's data loads. */
export function DashLoading(){
  return <main className="dash" aria-busy="true"><div className="container dash-layout"><aside className="dash-nav dash-skeleton-nav" aria-hidden="true"><span/><span/><span/><span/></aside>
    <section className="dash-main"><p className="sr-only" role="status">Loading…</p><div className="dash-skeleton" aria-hidden="true"><span className="sk-title"/><div className="stat-grid">{[0,1,2,3].map(i=><span key={i} className="sk-stat"/>)}</div><span className="sk-card"/><span className="sk-card"/></div></section></div></main>;
}
