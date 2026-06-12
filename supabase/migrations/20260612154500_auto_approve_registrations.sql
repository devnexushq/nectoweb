-- Make Necto onboarding frictionless while preserving existing approval columns/history.
-- Existing pending users are upgraded safely, and future inserts default to approved.

update public.customers
set approval_status = 'approved',
    approval_notes = null,
    last_updated_at = now()
where approval_status is null or approval_status = 'pending';

update public.workers
set approval_status = 'approved',
    approval_notes = null,
    last_updated_at = now()
where approval_status is null or approval_status = 'pending';

update public.shops
set approval_status = 'approved',
    approval_notes = null,
    last_updated_at = now()
where approval_status is null or approval_status = 'pending';

alter table public.customers
  alter column approval_status set default 'approved';

alter table public.workers
  alter column approval_status set default 'approved';

alter table public.shops
  alter column approval_status set default 'approved';

create or replace function public.force_registration_approved()
returns trigger
language plpgsql
as $$
begin
  if new.approval_status is null or new.approval_status = 'pending' then
    new.approval_status := 'approved';
    new.approval_notes := null;
  end if;
  return new;
end;
$$;

drop trigger if exists force_customers_registration_approved on public.customers;
create trigger force_customers_registration_approved
before insert on public.customers
for each row execute function public.force_registration_approved();

drop trigger if exists force_workers_registration_approved on public.workers;
create trigger force_workers_registration_approved
before insert on public.workers
for each row execute function public.force_registration_approved();

drop trigger if exists force_shops_registration_approved on public.shops;
create trigger force_shops_registration_approved
before insert on public.shops
for each row execute function public.force_registration_approved();
