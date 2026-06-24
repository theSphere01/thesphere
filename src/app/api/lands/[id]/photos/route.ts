import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/auth/handle-error";

const addUrlSchema = z.object({
  url:     z.string().url(),
  caption: z.string().max(200).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("land_photos")
      .select("*")
      .eq("land_id", id)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch photos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = createAdminClient();
    const contentType = req.headers.get("content-type") ?? "";

    let photoUrl: string;
    let caption: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      // File upload path
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      caption = (formData.get("caption") as string | null) ?? undefined;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const timestamp = Date.now();
      const path = `lands/${id}/${timestamp}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("sphere-media")
        .upload(path, buffer, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("sphere-media")
        .getPublicUrl(path);

      photoUrl = urlData.publicUrl;
    } else {
      // URL path
      const body = await req.json();
      const parsed = addUrlSchema.parse(body);
      photoUrl = parsed.url;
      caption = parsed.caption;
    }

    // Get current max sort_order
    const { data: existing } = await supabase
      .from("land_photos")
      .select("sort_order")
      .eq("land_id", id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    const { data, error } = await supabase
      .from("land_photos")
      .insert({ land_id: id, url: photoUrl, caption, sort_order: nextOrder })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("photo_id");

    if (!photoId) {
      return NextResponse.json({ error: "photo_id is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch photo to get URL for Storage cleanup
    const { data: photo } = await supabase
      .from("land_photos")
      .select("url")
      .eq("id", photoId)
      .eq("land_id", id)
      .single();

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Delete the DB row
    const { error } = await supabase
      .from("land_photos")
      .delete()
      .eq("id", photoId)
      .eq("land_id", id);

    if (error) throw error;

    // Try to remove from Storage (best-effort — only works for uploaded files)
    if (photo.url.includes("sphere-media")) {
      const urlObj = new URL(photo.url);
      const storagePath = urlObj.pathname.split("/sphere-media/")[1];
      if (storagePath) {
        await supabase.storage.from("sphere-media").remove([storagePath]);
      }
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    return handleRouteError(err);
  }
}
