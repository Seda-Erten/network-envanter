import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();
  const { name, size_u, location, pos_x, pos_y } = body;

  const existing = db.prepare("SELECT * FROM racks WHERE id = ?").get(id);
  if (!existing) {
    return NextResponse.json({ error: "Dolap bulunamadı." }, { status: 404 });
  }
  db.prepare(
    `UPDATE racks
     SET name = @name, size_u = @size_u, location = @location, pos_x = @pos_x, pos_y = @pos_y
     WHERE id = @id`
  ).run({
    id,
    name: name ?? existing.name,
    size_u: size_u !== undefined ? parseInt(size_u) : existing.size_u,
    location: location ?? existing.location,
    pos_x: pos_x !== undefined ? parseInt(pos_x) : existing.pos_x,
    pos_y: pos_y !== undefined ? parseInt(pos_y) : existing.pos_y,
  });

  const updated = db.prepare("SELECT * FROM racks WHERE id = ?").get(id);
  return NextResponse.json(updated);
}

export async function DELETE(_request, { params }) {
  const { id } = params;
  const existing = db.prepare("SELECT * FROM racks WHERE id = ?").get(id);
  if (!existing) {
    return NextResponse.json({ error: "Dolap bulunamadı." }, { status: 404 });
  }

  db.prepare("DELETE FROM racks WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
