import type { Metadata,Viewport } from "next";
import "./globals.css";
import "./hero-fix.css";
import { Header,Footer } from "@/components/chrome";
export const metadata:Metadata={title:{default:"BikeHub — Ride More. Worry Less.",template:"%s | BikeHub"},description:"Trusted premium motorcycle service, routes and rider knowledge across India.",applicationName:"BikeHub",appleWebApp:{title:"BikeHub",statusBarStyle:"black-translucent"}};
export const viewport:Viewport={themeColor:"#031c38"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Header/>{children}<Footer/></body></html>}
