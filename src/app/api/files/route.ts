import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { FileService } from "@/server/services";

export async function GET(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || undefined;
  const deliverableId = searchParams.get("deliverableId") || undefined;
  const taskId = searchParams.get("taskId") || undefined;

  try {
    const files = await FileService.listFiles(user, {
      projectId,
      deliverableId,
      taskId,
    });
    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch files" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const fileEntry = formData.get("file");
      const projectId = formData.get("projectId") as string | null;
      const deliverableId = formData.get("deliverableId") as string | null;
      const taskId = formData.get("taskId") as string | null;
      const visibility = (formData.get("visibility") as any) || "INTERNAL";

      if (!fileEntry || !(fileEntry instanceof Blob)) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      const fileName = fileEntry.name || "uploaded-file";
      const fileSize = fileEntry.size;
      const fileType = fileEntry.type || "application/octet-stream";
      const arrayBuffer = await fileEntry.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded = await FileService.uploadFile(user, {
        projectId,
        deliverableId,
        taskId,
        fileName,
        fileSize,
        fileType,
        buffer,
        visibility,
      });

      return NextResponse.json({ file: uploaded }, { status: 201 });
    } else {
      // JSON body (for simulated uploads / testing / remote links)
      const body = await req.json();
      const uploaded = await FileService.uploadFile(user, {
        projectId: body.projectId,
        deliverableId: body.deliverableId,
        taskId: body.taskId,
        fileName: body.fileName,
        fileSize: body.fileSize || 1024,
        fileType: body.fileType || "application/pdf",
        visibility: body.visibility || "INTERNAL",
      });

      return NextResponse.json({ file: uploaded }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "File upload failed" }, { status: 400 });
  }
}
