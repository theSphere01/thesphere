function normalizeBaseUrl(raw: string) {
  const base = raw.startsWith("http") ? raw : `https://${raw}`;
  return base.replace(/\/+$/, "");
}

function getHostname(raw: string) {
  try {
    return new URL(normalizeBaseUrl(raw)).hostname;
  } catch {
    return "";
  }
}

function isAllowedRequestOrigin(origin?: string) {
  if (!origin) return false;
  const hostname = getHostname(origin);
  if (!hostname) return false;

  const configuredHosts = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    "https://thesphere-six.vercel.app",
  ]
    .filter(Boolean)
    .map((value) => getHostname(value!));

  return (
    configuredHosts.includes(hostname) ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

export function getAppUrl(path = "", requestOrigin?: string) {
  const raw =
    (isAllowedRequestOrigin(requestOrigin) ? requestOrigin : undefined) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "https://thesphere-six.vercel.app";
  const normalizedBase = normalizeBaseUrl(raw);
  const normalizedPath = path ? `/${path.replace(/^\/+/, "")}` : "";

  return `${normalizedBase}${normalizedPath}`;
}
