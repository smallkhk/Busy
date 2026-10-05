-- Abuja Life: voice notes for GistApp.
-- Run once in Supabase Dashboard → SQL Editor, after messaging.sql. Safe to re-run.

-- Messages can carry a voice note.
alter table public.messages add column if not exists voice_path text;
alter table public.messages add column if not exists voice_ms int check (voice_ms between 0 and 31000);

-- You can only attach a voice note you uploaded for that same friend.
drop policy if exists "text my friends" on public.messages;
create policy "text my friends" on public.messages for insert to authenticated
  with check (
    sender = auth.uid()
    and exists (select 1 from public.friends f where f.user_id = auth.uid() and f.friend_id = recipient)
    and (voice_path is null or voice_path like auth.uid()::text || '/' || recipient::text || '/%')
  );

-- Private bucket. 256 KB cap per file: a 30 s Opus note is about 60 KB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice', 'voice', false, 262144, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/mpeg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Files live at <sender>/<recipient>/<file>. Upload and delete only into your own folder;
-- only the sender and the recipient can play it.
drop policy if exists "voice upload own" on storage.objects;
create policy "voice upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'voice' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "voice read mine" on storage.objects;
create policy "voice read mine" on storage.objects for select to authenticated
  using (bucket_id = 'voice' and ((storage.foldername(name))[1] = auth.uid()::text or (storage.foldername(name))[2] = auth.uid()::text));
drop policy if exists "voice delete own" on storage.objects;
create policy "voice delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'voice' and (storage.foldername(name))[1] = auth.uid()::text);
