"use client";
import {useEffect} from "react";import {usePathname} from "next/navigation";
/** Page-wide motion: reveals `[data-reveal]` blocks as they scroll into view, counts up `[data-count]` numbers and marks the header once the page scrolls. */
export function ScrollFx(){const path=usePathname();
  useEffect(()=>{const root=document.documentElement;root.classList.add("fx");
    const onScroll=()=>root.classList.toggle("scrolled",window.scrollY>12);onScroll();window.addEventListener("scroll",onScroll,{passive:true});
    const still=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;const el=e.target as HTMLElement;el.classList.add("in");io.unobserve(el);if(el.dataset.count&&!still)countUp(el)}),{rootMargin:"0px 0px -60px 0px",threshold:0});
    document.querySelectorAll("[data-reveal]:not(.in),[data-count]").forEach(el=>io.observe(el));
    return ()=>{window.removeEventListener("scroll",onScroll);io.disconnect()};
  },[path]);
  return null;
}
function countUp(el:HTMLElement){const target=Number(el.dataset.count);if(!target)return;const fmt=new Intl.NumberFormat("en-IN");const start=performance.now();
  const step=(t:number)=>{const p=Math.min(1,(t-start)/1400);el.textContent=fmt.format(Math.round(target*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step);
}
