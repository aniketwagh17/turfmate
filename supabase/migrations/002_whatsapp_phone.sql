-- Add a WhatsApp contact number to each authenticated user's profile.
-- Users provide this after their first successful sign-in.
begin;
alter table public.profiles
  add column if not exists whatsapp_phone text;
comment on column public.profiles.whatsapp_phone is
  'User-provided WhatsApp phone number in international E.164 format, e.g. +919876543210';
commit;
