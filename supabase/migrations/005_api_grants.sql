-- Explicit API privileges used alongside the RLS policies.
grant usage on schema public to anon, authenticated;
grant select on public.service_categories, public.service_centres, public.centre_services, public.centre_capabilities, public.centre_photos, public.reviews, public.routes, public.route_stops, public.events, public.posts, public.comments to anon, authenticated;
grant insert on public.enquiries, public.reviews, public.event_registrations, public.comments, public.reports to anon, authenticated;
grant select, insert, update on public.service_centres, public.centre_services, public.centre_capabilities, public.centre_photos to authenticated;
grant select, update on public.enquiries to authenticated;
grant select, update on public.profiles to authenticated;
grant execute on function public.current_role() to anon, authenticated;
