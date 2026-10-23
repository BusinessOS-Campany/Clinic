import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/core/auth/server";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { readDocumentBuffer } from "@/lib/documents/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as
    | { id: string; roleId?: string; currentClinicId?: string | null }
    | undefined;
  if (
    !session?.user ||
    !user?.id ||
    !(await can({ id: user.id, roleId: user.roleId ?? "" }, "patients:read"))
  ) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const clinicId = user.currentClinicId ?? null;
  if (!clinicId) {
    return NextResponse.json({ ok: false, error: "no-clinic" }, { status: 403 });
  }

  const { id } = await params;
  const doc = await prisma.patientDocument.findFirst({
    where: { id, clinicId },
    select: { fileName: true, mimeType: true, storageKey: true },
  });
  if (!doc) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  }

  const buffer = readDocumentBuffer(doc.storageKey);
  if (!buffer) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const type = doc.mimeType || "application/octet-stream";
  const encoded = encodeURIComponent(doc.fileName);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(buffer.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, no-store",
    },
  });
}