const SUPABASE_LOCAL = /^https?:\/\/(127\.0\.0\.1|localhost):54331/;

export function imgUrl(url) {
  if (!url || !import.meta.env.DEV) return url;
  return url.replace(SUPABASE_LOCAL, window.location.origin);
}
