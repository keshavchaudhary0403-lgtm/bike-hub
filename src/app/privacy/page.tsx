import type {Metadata} from "next";import Link from "next/link";import {LegalPage} from "@/components/legal";
export const metadata:Metadata={title:"Privacy policy"};
export default function Privacy(){return <LegalPage title="Privacy policy" intro="What personal data BikeHub collects, why, and the choices you have.">
<h2>1. Browsing without an account</h2><p>You can search listings and read routes and guides without an account. We don’t use analytics, advertising or tracking tools, and we don’t build profiles of visitors.</p>
<h2>2. What we collect</h2><ul>
<li><b>Enquiries to a business:</b> your name, phone number, optional email and what you need. Shared with the business you chose and the BikeHub team.</li>
<li><b>Contact form:</b> your name, email and message, seen only by the BikeHub team.</li>
<li><b>Partner and admin accounts:</b> email address, a securely stored password, display name, and the listing details you edit.</li>
<li><b>Technical data:</b> our hosting provider keeps standard server logs, such as IP address, browser type and pages requested, to run and protect the site.</li></ul>
<h2>3. Why we use it</h2><p>We use this data only to deliver your enquiry to the business, reply to your message, run partner accounts, verify listings, and keep the site secure. We don’t sell your personal data or use it for advertising.</p>
<h2>4. Who we share it with</h2><ul>
<li>The business you send an enquiry to.</li>
<li>Service providers who run BikeHub for us: <b>Vercel</b> (website hosting) and <b>Supabase</b> (database and login).</li>
<li>Authorities, where the law requires it.</li></ul>
<h2>5. Maps and outside links</h2><p>Listing pages show a map from <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">OpenStreetMap</a>. Loading the map sends your IP address to OpenStreetMap’s servers. “Directions” and “Google Maps” buttons open Google Maps, which follows Google’s own privacy policy.</p>
<h2>6. How long we keep it</h2><p>Enquiries and messages are kept as long as needed to handle them and for reasonable record-keeping, then deleted. Partner account data is kept while the account is active.</p>
<h2>7. Your choices</h2><p>You can ask us to access, correct or delete your personal data, or withdraw consent where we rely on it. <Link href="/contact">Contact us</Link> and we’ll respond within a reasonable time. We handle personal data in line with India’s Digital Personal Data Protection Act, 2023.</p>
<h2>8. Security</h2><p>Data is sent over encrypted connections (HTTPS) and stored with access controls, so riders can’t read other people’s enquiries and businesses see only their own.</p>
<h2>9. Children</h2><p>BikeHub is meant for adults. Please don’t send us personal data about children.</p>
<h2>10. Changes</h2><p>We may update this policy, and the date above shows the latest version.</p>
</LegalPage>}
