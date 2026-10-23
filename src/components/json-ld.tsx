/** Structured data for search engines. `<` is escaped so text from the database can't break out of the script tag. */
export function JsonLd({data}:{data:Record<string,unknown>}){
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org",...data}).replace(/</g,"\\u003c")}}/>;
}
