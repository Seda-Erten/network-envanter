import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const userId = request.cookies.get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const labels = db.prepare("SELECT * FROM port_labels WHERE user_id = ?").all(userId);
  return NextResponse.json(labels);
}

export async function POST(request) {
  const userId = request.cookies.get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const { device_id, port_number, label } = body;

  if (!device_id || !port_number) {
    return NextResponse.json({ error: "Cihaz ve port numarası zorunludur." }, { status: 400 });
  }

  const existing = db.prepare("SELECT id FROM port_labels WHERE device_id = ? AND port_number = ? AND user_id = ?").get(device_id, port_number, userId);
  
  if (existing) {
    db.prepare("UPDATE port_labels SET label = ? WHERE id = ?").run(label || '', existing.id);
  } else {
    db.prepare("INSERT INTO port_labels (device_id, port_number, label, user_id) VALUES (?, ?, ?, ?)").run(device_id, port_number, label || '', userId);
  }

  return NextResponse.json({ success: true });
}
