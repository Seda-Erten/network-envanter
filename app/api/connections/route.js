import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const userId = request.cookies.get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const connections = db
    .prepare(
      `SELECT
        c.id, c.port_a, c.port_b, c.cable_type, c.speed, c.color, c.status, c.note, c.created_at,
        da.id AS device_a_id, da.name AS device_a_name,
        db_.id AS device_b_id, db_.name AS device_b_name
       FROM connections c
       JOIN devices da ON da.id = c.device_a_id
       JOIN devices db_ ON db_.id = c.device_b_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`
    )
    .all(userId);

  return NextResponse.json(connections);
}

export async function POST(request) {
  const userId = request.cookies.get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const { device_a_id, port_a, device_b_id, port_b, cable_type, speed, color, status, note } =
    body;

  if (!device_a_id || !device_b_id || !port_a || !port_b) {
    return NextResponse.json(
      { error: "İki cihaz ve port bilgileri zorunludur." },
      { status: 400 }
    );
  }

  if (device_a_id === device_b_id) {
    return NextResponse.json({ error: "Bir cihazı kendisine bağlayamazsınız!" }, { status: 400 });
  }

  const existingA = db.prepare(`SELECT id FROM connections WHERE (device_a_id = ? AND port_a = ?) OR (device_b_id = ? AND port_b = ?)`).get(device_a_id, port_a, device_a_id, port_a);
  if (existingA) {
    return NextResponse.json({ error: `1. Cihazın ${port_a} numaralı portu zaten başka bir kablo ile dolu!` }, { status: 400 });
  }

  const existingB = db.prepare(`SELECT id FROM connections WHERE (device_a_id = ? AND port_a = ?) OR (device_b_id = ? AND port_b = ?)`).get(device_b_id, port_b, device_b_id, port_b);
  if (existingB) {
    return NextResponse.json({ error: `2. Cihazın ${port_b} numaralı portu zaten başka bir kablo ile dolu!` }, { status: 400 });
  }
  
  const stmt = db.prepare(
    `INSERT INTO connections
      (device_a_id, port_a, device_b_id, port_b, cable_type, speed, color, status, note, user_id)
     VALUES (@device_a_id, @port_a, @device_b_id, @port_b, @cable_type, @speed, @color, @status, @note, @user_id)`
  );

  const result = stmt.run({
    device_a_id,
    port_a,
    device_b_id,
    port_b,
    cable_type: cable_type || "Cat6",
    speed: speed || "1Gbps",
    color: color || "#3b82f6",
    status: status || "aktif",
    note: note || "",
    user_id: userId,
  });

  const created = db
    .prepare("SELECT * FROM connections WHERE id = ?")
    .get(result.lastInsertRowid);

  return NextResponse.json(created, { status: 201 });
}