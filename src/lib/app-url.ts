export function getAppUrl(path = "") {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "https://thesphere-six.vercel.app";
  const base = raw.startsWith("http") ? raw : `https://${raw}`;
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path ? `/${path.replace(/^\/+/, "")}` : "";

  return `${normalizedBase}${normalizedPath}`;
}
