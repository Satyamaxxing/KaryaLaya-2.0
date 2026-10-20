import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/server/db";
import { StorageService } from "@/server/storage";
import { getCurrentSession } from "@/server/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const isPreview = searchParams.get("preview") === "true";

  // Security check: either a valid signed token OR an authenticated session with access
  let authorized = false;
  let callerOrgId: string | undefined;

  if (token) {
    const verification = StorageService.verifySignedToken(token);
    if (verification.valid && verification.fileId === id) {
      authorized = true;
      callerOrgId = verification.organizationId;
    }
  }

  const session = await getCurrentSession();
  if (!authorized && session) {
    authorized = true;
    callerOrgId = session.organizationId;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Invalid, expired, or missing signed download token." }, { status: 403 });
  }

  const file = await prisma.fileAsset.findUnique({
    where: { id },
  });

  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  if (callerOrgId && file.organizationId !== callerOrgId) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  // Client visibility & scoping check
  if (session && session.role === "CLIENT") {
    if (file.visibility !== "CLIENT_VISIBLE") {
      return NextResponse.json({ error: "Access denied: This file is internal." }, { status: 403 });
    }
    if (session.clientId) {
      if (file.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: file.projectId },
          select: { clientId: true },
        });
        if (project && project.clientId !== session.clientId) {
          return NextResponse.json({ error: "Access denied." }, { status: 403 });
        }
      }
      if (file.deliverableId) {
        const deliverable = await prisma.deliverable.findUnique({
          where: { id: file.deliverableId },
          include: { project: { select: { clientId: true } } },
        });
        if (deliverable && deliverable.project.clientId !== session.clientId) {
          return NextResponse.json({ error: "Access denied." }, { status: 403 });
        }
      }
    }
  }

  // Resolve local file path
  const localFilePath = path.join(process.cwd(), "public", "uploads", file.storageKey);

  let fileBuffer: Buffer;
  if (fs.existsSync(localFilePath)) {
    fileBuffer = fs.readFileSync(localFilePath);
  } else {
    fileBuffer = Buffer.from(`KaryaLaya Deliverable Asset [${file.fileName}] - Size: ${file.fileSize} bytes.`);
  }

  const dispositionType = isPreview ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": file.fileType || "application/octet-stream",
      "Content-Disposition": `${dispositionType}; filename="${encodeURIComponent(file.fileName)}"`,
      "Content-Length": fileBuffer.length.toString(),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
