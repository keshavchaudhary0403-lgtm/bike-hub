import type { NextConfig } from "next";
const nextConfig: NextConfig = {images:{formats:["image/avif","image/webp"],remotePatterns:[{protocol:"https",hostname:"*.supabase.co",pathname:"/storage/v1/object/public/listing-photos/**"},{protocol:"https",hostname:"*.supabase.co",pathname:"/storage/v1/object/public/content-images/**"},{protocol:"https",hostname:"images.unsplash.com",pathname:"/photo-**"}]}};
export default nextConfig;
