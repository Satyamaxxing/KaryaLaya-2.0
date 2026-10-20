import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth";
import { AutomationService } from "@/server/services/automations";

export async function GET() {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await AutomationService.listRules(user);
    return NextResponse.json({ success: true, rules });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load automations";
    const status = message.includes("Access Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, triggerType, triggerConfig, actionType, actionConfig, requiresApproval } = body;

    if (!name || !triggerType || !actionType || !actionConfig) {
      return NextResponse.json(
        { error: "Missing required fields: name, triggerType, actionType, actionConfig" },
        { status: 400 }
      );
    }

    const rule = await AutomationService.createRule(user, {
      name,
      description,
      triggerType,
      triggerConfig,
      actionType,
      actionConfig,
      requiresApproval,
    });

    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create automation rule";
    const status = message.includes("Access Denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
