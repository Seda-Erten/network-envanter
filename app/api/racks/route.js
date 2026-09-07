import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const userId = request.cookies.get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const racks = db.prepare("SELECT * FROM racks WHERE user_id = ? ORDER BY created_at ASC").all(userId);
  return NextResponse.json(racks);
}

export async function POST(request) {
  const body = await request.json();
  const { name, size_u, location, pos_x, pos_y } = body;

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Dolap adı zorunludur." },
      { status: 400 }
    );
  }

  const userId = request.cookies.get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const stmt = db.prepare(
    `INSERT INTO racks (name, size_u, location, user_id, pos_x, pos_y)
     VALUES (@name, @size_u, @location, @user_id, @pos_x, @pos_y)`
  );

  const result = stmt.run({
    name: name.trim(),
    size_u: size_u ? parseInt(size_u) : 42,
    location: location || "",
    user_id: userId,
    pos_x: pos_x !== undefined ? parseInt(pos_x) : 0,
    pos_y: pos_y !== undefined ? parseInt(pos_y) : 0,
  });

  const created = db.prepare("SELECT * FROM racks WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(created, { status: 201 });
}
