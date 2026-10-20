import Link from "next/link";import {PageHero} from "@/components/page-hero";
export const LEGAL_UPDATED="18 October 2026";
/** Shared layout for the Terms, Privacy and Cookies pages. */
export function LegalPage({title,intro,children}:{title:string;intro:string;children:React.ReactNode}){return <main><PageHero eyebrow="Legal" title={title} intro={intro}/><section className="section"><article className="container article legal"><p className="muted">Last updated {LEGAL_UPDATED}</p>{children}<nav className="legal-links" aria-label="Legal"><Link href="/terms">Terms of use</Link><Link href="/privacy">Privacy policy</Link><Link href="/cookies">Cookie policy</Link><Link href="/contact">Contact us</Link></nav></article></section></main>}
