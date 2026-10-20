// Per-theme settings. Each design option (branch) only changes this file, the theme block at the end of globals.css and the icon colours.
export type HeroPhoto={src:string;alt:string;credit:string;href:string};
export type HeroLayout="full"|"split"|"diagonal";
const unsplash=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=2400&q=80`;

export const THEME:{name:string;hero:{layout:HeroLayout;flip?:boolean;photos:HeroPhoto[]}}={
  name:"Asphalt & Ember",
  hero:{layout:"full",flip:true,photos:[
    {src:unsplash("photo-1636989098361-c5dfcf3acdde"),alt:"Rider silhouetted against a red-orange sunset",credit:"Trosh Bias",href:"https://unsplash.com/photos/a-person-riding-a-motorcycle-at-sunset-4_Y4GVX5HUQ"}
  ]}
};
