import type {Metadata} from "next";import Link from "next/link";import {LegalPage} from "@/components/legal";
export const metadata:Metadata={title:"Cookie policy"};
export default function Cookies(){return <LegalPage title="Cookie policy" intro="BikeHub uses as few cookies as possible.">
<h2>1. Visitors</h2><p>If you’re just browsing, BikeHub doesn’t set any cookies. We don’t use analytics, advertising or tracking cookies, so there is no cookie banner.</p>
<h2>2. Partners and admins</h2><p>When a business partner or administrator signs in, our login provider (Supabase) sets <b>strictly necessary</b> cookies that keep them signed in securely. These are removed when they sign out or the session expires. The site’s login can’t work without them.</p>
<h2>3. Third-party content</h2><p>The OpenStreetMap map on listing pages is loaded from openstreetmap.org and is covered by <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noreferrer">its own privacy policy</a>. Links to Google Maps open Google’s site, which has its own cookie policy.</p>
<h2>4. Managing cookies</h2><p>You can block or delete cookies in your browser settings. Browsing BikeHub will work as normal, but partner login won’t.</p>
<h2>5. Changes</h2><p>If we ever add other cookies, we’ll update this page first. See also our <Link href="/privacy">privacy policy</Link>.</p>
</LegalPage>}
