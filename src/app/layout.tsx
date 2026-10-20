import type { Metadata,Viewport } from "next";
import { Inter,Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { Header,Footer } from "@/components/chrome";
import { ScrollFx } from "@/components/fx";
const inter=Inter({subsets:["latin"],variable:"--font-sans",display:"swap"});
const display=Barlow_Condensed({subsets:["latin"],weight:["600","700","800"],style:["normal","italic"],variable:"--font-display",display:"swap"});
export const metadata:Metadata={title:{default:"BikeHub — Ride More. Worry Less.",template:"%s | BikeHub"},description:"Find motorcycle service centres, repair shops and riding gear across India.",applicationName:"BikeHub",appleWebApp:{title:"BikeHub",statusBarStyle:"black-translucent"}};
export const viewport:Viewport={themeColor:"#0f1114"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={`${inter.variable} ${display.variable}`}><body><Header/>{children}<Footer/><ScrollFx/></body></html>}
