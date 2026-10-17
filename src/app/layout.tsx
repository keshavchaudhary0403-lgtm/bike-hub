import type { Metadata,Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header,Footer } from "@/components/chrome";
const inter=Inter({subsets:["latin"],variable:"--font-sans",display:"swap"});
export const metadata:Metadata={title:{default:"BikeHub — Ride More. Worry Less.",template:"%s | BikeHub"},description:"Find motorcycle service centres, repair shops and riding gear across India.",applicationName:"BikeHub",appleWebApp:{title:"BikeHub",statusBarStyle:"black-translucent"}};
export const viewport:Viewport={themeColor:"#031c38"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={inter.variable}><body><Header/>{children}<Footer/></body></html>}
