import type { Metadata,Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./themes.css";
import { Header,Footer } from "@/components/chrome";
import { ScrollFx } from "@/components/fx";
import { THEME } from "@/lib/theme";
import { display } from "@/lib/theme-font";
const inter=Inter({subsets:["latin"],variable:"--font-sans",display:"swap"});
export const metadata:Metadata={title:{default:"BikeHub — Ride More. Worry Less.",template:"%s | BikeHub"},description:"Find motorcycle service centres, repair shops and riding gear across India.",applicationName:"BikeHub",appleWebApp:{title:"BikeHub",statusBarStyle:"black-translucent"}};
export const viewport:Viewport={themeColor:THEME.color};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-theme={THEME.id} className={`${inter.variable} ${display.variable}`}><body><Header/>{children}<Footer/><ScrollFx/></body></html>}
