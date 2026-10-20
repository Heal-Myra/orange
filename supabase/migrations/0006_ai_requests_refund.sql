-- Happy Orange — a failed AI answer is given back: the server deletes that request's row (20 Oct 2026).
drop policy if exists "own ai requests: remove" on public.ai_requests;
create policy "own ai requests: remove" on public.ai_requests
  for delete using (auth.uid() = user_id);
