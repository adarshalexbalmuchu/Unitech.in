create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'payment_initiated', 'paid', 'failed', 'cancelled')),
  currency text not null default 'INR',
  amount_subtotal_paise integer not null check (amount_subtotal_paise >= 0),
  amount_total_paise integer not null check (amount_total_paise >= 0),
  cart_snapshot jsonb not null,
  shipping_snapshot jsonb not null,
  idempotency_key text not null,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = _role
  );
$$;

revoke all on function public.has_role(uuid, text) from public;
grant execute on function public.has_role(uuid, text) to authenticated;

alter table public.orders enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
on public.orders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own pending orders" on public.orders;
create policy "Users can create own pending orders"
on public.orders
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status in ('pending', 'payment_initiated')
);

drop policy if exists "Users can update only their non-final own orders" on public.orders;
create policy "Users can update only their non-final own orders"
on public.orders
for update
to authenticated
using (
  auth.uid() = user_id
  and status in ('pending', 'payment_initiated')
)
with check (
  auth.uid() = user_id
  and status in ('pending', 'payment_initiated', 'cancelled')
);

drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

alter table public.products enable row level security;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
on public.products
for select
to anon, authenticated
using (coalesce(is_active, true) = true);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));
