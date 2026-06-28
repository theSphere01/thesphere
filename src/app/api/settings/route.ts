import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";
import { DEFAULT_HOME_GALLERY_PHOTOS, serializeHomeGalleryPhotos } from "@/lib/home-gallery";

const DEFAULTS: Record<string, string> = {
  home_hero_photo: "/photos/sphere-arch-hero.jpeg",
  home_transition_photo: "/images/sphere-brand-pattern.jpeg",
  home_gallery_photos: serializeHomeGalleryPhotos(DEFAULT_HOME_GALLERY_PHOTOS),
};

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("site_settings").select("key, value");

  if (error) {
    return NextResponse.json({ data: DEFAULTS });
  }

  const result = { ...DEFAULTS };
  (data ?? []).forEach(({ key, value }: { key: string; value: string }) => {
    result[key] = value;
  });

  return NextResponse.json({ data: result });
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const body = await req.json();
    const { key, value } = body as { key: string; value: string };

    if (!key || typeof value !== "string") {
      return NextResponse.json({ error: "key and value are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { key, value } });
  } catch (err) {
    return handleRouteError(err);
  }
}
