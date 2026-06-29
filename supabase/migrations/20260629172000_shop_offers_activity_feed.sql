alter table public.activity_feed
  add column if not exists linked_shop_id uuid references public.shops(id) on delete cascade,
  add column if not exists offer_start_at timestamp with time zone,
  add column if not exists offer_end_at timestamp with time zone,
  add column if not exists category text,
  add column if not exists discount_text text;

create index if not exists activity_feed_offer_lookup_idx
  on public.activity_feed (type, status, linked_shop_id, offer_end_at);

drop policy if exists "Published shop offers are readable" on public.activity_feed;
create policy "Published shop offers are readable"
on public.activity_feed
for select
to anon, authenticated
using (
  type = 'offer'
  and status = 'published'
  and (offer_end_at is null or offer_end_at >= now())
  and (expires_at is null or expires_at >= now())
);

drop policy if exists "Shop profiles can create offers" on public.activity_feed;
create policy "Shop profiles can create offers"
on public.activity_feed
for insert
to anon, authenticated
with check (
  type = 'offer'
  and linked_shop_id is not null
  and created_by = linked_shop_id
  and exists (
    select 1 from public.shops
    where shops.id = activity_feed.linked_shop_id
  )
);

drop policy if exists "Shop profiles can read their offers" on public.activity_feed;
create policy "Shop profiles can read their offers"
on public.activity_feed
for select
to anon, authenticated
using (
  type = 'offer'
  and linked_shop_id is not null
  and created_by = linked_shop_id
);

drop policy if exists "Shop profiles can update their offers" on public.activity_feed;
create policy "Shop profiles can update their offers"
on public.activity_feed
for update
to anon, authenticated
using (
  type = 'offer'
  and linked_shop_id is not null
  and created_by = linked_shop_id
)
with check (
  type = 'offer'
  and linked_shop_id is not null
  and created_by = linked_shop_id
);

drop policy if exists "Shop profiles can delete their offers" on public.activity_feed;
create policy "Shop profiles can delete their offers"
on public.activity_feed
for delete
to anon, authenticated
using (
  type = 'offer'
  and linked_shop_id is not null
  and created_by = linked_shop_id
);
