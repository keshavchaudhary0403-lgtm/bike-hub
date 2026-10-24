-- 1. Authorised dealers from OpenStreetMap brand tags.
--    official_brands is set from the OSM brand tag (normalised), and the dealer gets CLAIMED cells for
--    that brand's bike levels × routine care and repairs (S1–S2) only, where a claim alone may be shown.
--    Nothing is ever marked visited or proven automatically.
with raw as (
  select c.id, b as tag
  from public.service_centres c, unnest(c.brands) b
  where c.source = 'osm' and c.listing_type = 'service_centre'
), norm as (
  select id, unnest(case lower(trim(tag))
    when 'honda' then array['Honda'] when 'honda motor company' then array['Honda']
    when 'hero' then array['Hero'] when 'hero honda' then array['Hero']
    when 'tvs' then array['TVS'] when 'tvs motors' then array['TVS']
    when 'bajaj' then array['Bajaj'] when 'chetak' then array['Bajaj']
    when 'yamaha' then array['Yamaha'] when 'suzuki' then array['Suzuki'] when 'ktm' then array['KTM']
    when 'royal enfield' then array['Royal Enfield'] when 'kawasaki' then array['Kawasaki']
    when 'triumph' then array['Triumph'] when 'ducati' then array['Ducati'] when 'bmw' then array['BMW']
    when 'harley-davidson' then array['Harley-Davidson'] when 'harley davidson' then array['Harley-Davidson']
    when 'yezdi' then array['Yezdi'] when 'yezdi jawa' then array['Jawa','Yezdi'] when 'jawa' then array['Jawa']
    when 'ola' then array['Ola Electric'] when 'ather' then array['Ather'] when 'ather energy' then array['Ather']
    when 'vespa' then array['Vespa']
    else array[]::text[] end) as brand
  from raw
), dealers as (
  -- A shop tagged with several unrelated brands is a multi-brand workshop, not an authorised dealer.
  -- Jawa, Yezdi and BSA are one company (Classic Legends) and share showrooms.
  select id, array_agg(distinct brand order by brand) brands from norm group by id
  having count(distinct brand) = 1 or bool_and(brand in ('Jawa','Yezdi','BSA'))
)
update public.service_centres c set official_brands = d.brands, brand_exclusive = true
from dealers d where c.id = d.id and c.official_brands = '{}';

-- Bike levels each dealer sells. Some brands sell their mid-weight bikes only through separate premium
-- showrooms (Honda BigWing, Yamaha Blue Square, Hero Premia), so ordinary dealers of those brands get L1 only.
insert into public.shop_capabilities (shop_id, bike_level, service_level, brands, status, source, note)
select c.id, lv.bike_level, sv.service_level, array_agg(distinct ob.brand order by ob.brand), 'claimed', 'osm', 'From the OpenStreetMap brand tag of an authorised dealer'
from public.service_centres c
cross join lateral unnest(c.official_brands) ob(brand)
join (select distinct brand, bike_level from public.bike_models where is_current_in_india and bike_level in ('L1','L2')) lv on lv.brand = ob.brand
cross join (values ('S1'),('S2')) sv(service_level)
where c.source = 'osm' and c.is_active
  and not (lv.bike_level = 'L2' and (
       (ob.brand = 'Honda' and c.name !~* 'big ?wing')
    or (ob.brand = 'Yamaha' and c.name !~* 'blue ?square')
    or (ob.brand = 'Hero' and c.name !~* 'premia')))
group by c.id, lv.bike_level, sv.service_level
on conflict (shop_id, bike_level, service_level) do nothing;

-- 2. Duplicate listings: same phone number and (almost) the same map position.
--    The oldest OSM record is kept; the others are hidden and their OSM ids stored on the kept listing
--    (merged_source_ids) so the importer never brings them back. Reviews and enquiries move across.
create temp table dup_map as
with keyed as (
  select id, source_id, right(regexp_replace(phone, '\D', '', 'g'), 10) ph, round(latitude, 3) la, round(longitude, 3) lo
  from public.service_centres
  where is_active and source = 'osm' and phone is not null and latitude is not null
), groups as (
  select ph, la, lo, (array_agg(id order by source_id))[1] keep_id
  from keyed group by ph, la, lo having count(*) > 1
)
select k.id dup_id, k.source_id dup_source, g.keep_id
from keyed k join groups g using (ph, la, lo) where k.id <> g.keep_id;

update public.reviews r set centre_id = m.keep_id from dup_map m where r.centre_id = m.dup_id;
update public.enquiries e set centre_id = m.keep_id from dup_map m where e.centre_id = m.dup_id;
update public.service_centres c set merged_source_ids = (select array_agg(distinct s) from unnest(c.merged_source_ids || x.ids) s)
from (select keep_id, array_agg(dup_source) ids from dup_map group by keep_id) x where c.id = x.keep_id;
update public.service_centres c set is_active = false, manually_edited = true from dup_map m where c.id = m.dup_id;
drop table dup_map;
