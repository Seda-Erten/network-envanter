import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();
  const { device_a_id, port_a, device_b_id, port_b, cable_type, speed, color, status, note } = body;
  const existing = db.prepare("SELECT * FROM connections WHERE id = ?").get(id);
  if (!existing) {
    return NextResponse.json(
      { error: "Bağlantı bulunamadı." },
      { status: 404 }
    );
  }

  db.prepare(`
    UPDATE connections 
    SET device_a_id = ?, port_a = ?, device_b_id = ?, port_b = ?, cable_type = ?, speed = ?, color = ?, status = ?, note = ?
    WHERE id = ?
  `).run(device_a_id, port_a, device_b_id, port_b, cable_type, speed, color, status, note, id);

  return NextResponse.json({ success: true });
}

export async function DELETE(_request, { params }) {
  const { id } = params;
  const existing = db.prepare("SELECT * FROM connections WHERE id = ?").get(id);
  if (!existing) {
    return NextResponse.json(
      { error: "Bağlantı bulunamadı." },
      { status: 404 }
    );
  }

  db.prepare("DELETE FROM connections WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
