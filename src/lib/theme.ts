// The active design theme. Each preview branch changes only this file and src/lib/theme-font.ts;
// all four themes' styles live in src/app/themes.css, keyed by <html data-theme>.
export type ThemeId="ember"|"racing";
export type HeroLayout="arch"|"studio";
export type HeroPhoto={src:string;alt:string;credit:string;href:string};
const unsplash=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=2000&q=80`;

export const PHOTOS={
  sunset:{src:unsplash("photo-1741542303195-dafb546d9b1e"),alt:"Rider heading into a peach sunset, reflected in a puddle",credit:"Jefferson Sees",href:"https://unsplash.com/photos/a-motorcyclist-rides-toward-a-beautiful-sunset-nNESWk6Rrvk"},
  studio:{src:unsplash("photo-1610643981357-8b6a16ae2521"),alt:"Rider in black leathers on a naked sportbike",credit:"Nick van der Vegt",href:"https://unsplash.com/photos/man-in-black-leather-jacket-riding-on-black-and-orange-sports-bike-wY_zWVv2yhM"}
} satisfies Record<string,HeroPhoto>;

export const THEME:{id:ThemeId;name:string;color:string;hero:{layout:HeroLayout;photos:HeroPhoto[]}}={
  id:"ember",name:"Asphalt & Ember",color:"#f6f3ee",
  hero:{layout:"arch",photos:[PHOTOS.sunset]}
};
