import type {Metadata} from "next";import {ContactForm} from "./contact-form";
export const metadata:Metadata={title:"Contact"};
export default function Contact(){return <main><section className="page-hero"><div className="container"><h1>Contact us</h1><p>Questions, feedback or claiming a listing. We reply by email.</p></div></section><section className="section soft"><div className="container" style={{maxWidth:640}}><ContactForm/></div></section></main>}
