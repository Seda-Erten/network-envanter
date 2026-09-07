import db from "@/lib/db";
import { NextResponse } from "next/server";

// PUT /api/devices/:id -> cihaz bilgilerini günceller
export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();
  const { name, type, location, ip_address, mac_address, brand, rack_id, rack_u, status, port_count, size_u } = body;

  const existing = db.prepare("SELECT * FROM devices WHERE id = ?").get(id);
  if (!existing) {
    return NextResponse.json({ error: "Cihaz bulunamadı." }, { status: 404 });
  }

  const updates = {
    id,
    name: name ?? existing.name,
    type: type ?? existing.type,
    location: location ?? existing.location,
    ip_address: ip_address ?? existing.ip_address,
    mac_address: mac_address ?? existing.mac_address,
    brand: brand ?? existing.brand,
    rack_id: rack_id !== undefined ? (rack_id ? parseInt(rack_id) : null) : existing.rack_id,
    rack_u: rack_u !== undefined ? (rack_u ? parseInt(rack_u) : null) : existing.rack_u,
    status: status ?? existing.status,
    port_count: port_count !== undefined ? parseInt(port_count) : existing.port_count,
    size_u: size_u !== undefined ? parseInt(size_u) : existing.size_u,
  };

  // Port sayısı düşürülüyorsa, yüksek portlarda kablo var mı kontrolü
  if (updates.port_count < existing.port_count) {
    const activeConnections = db.prepare(`
      SELECT * FROM connections 
      WHERE (device_a_id = ? AND CAST(port_a AS INTEGER) > ?) 
         OR (device_b_id = ? AND CAST(port_b AS INTEGER) > ?)
    `).all(id, updates.port_count, id, updates.port_count);

    if (activeConnections.length > 0) {
      return NextResponse.json(
        { error: `Cihazın port sayısını ${updates.port_count}'e düşüremezsiniz. ${updates.port_count} numarasından büyük portlarda şu an aktif kablo bağlantıları bulunuyor. Önce o kabloları sökünüz.` },
        { status: 400 }
      );
    }
  }

  // Aynı U slotunda başka cihaz var mı kontrolü (kendi ID'si hariç)
  if (updates.rack_id && updates.rack_u) {
    const rack = db.prepare("SELECT size_u FROM racks WHERE id = ?").get(updates.rack_id);
    if (rack) {
      if (updates.rack_u > rack.size_u || updates.rack_u < 1) {
        return NextResponse.json(
          { error: `Bu dolap maksimum ${rack.size_u}U kapasiteye sahip. Lütfen 1 ile ${rack.size_u} arası bir raf girin.` },
          { status: 400 }
        );
      }
    }

    const existingSlot = db.prepare("SELECT name FROM devices WHERE rack_id = ? AND rack_u = ? AND id != ?").get(updates.rack_id, updates.rack_u, id);
    if (existingSlot) {
      return NextResponse.json(
        { error: `Bu dolabın ${updates.rack_u}U rafında zaten "${existingSlot.name}" isimli cihaz bulunuyor.` },
        { status: 400 }
      );
    }
  }

  db.prepare(
    `UPDATE devices
     SET name = @name, type = @type, location = @location, ip_address = @ip_address, mac_address = @mac_address, brand = @brand, rack_id = @rack_id, rack_u = @rack_u, status = @status, port_count = @port_count, size_u = @size_u
     WHERE id = @id`
  ).run(updates);

  const updated = db.prepare("SELECT * FROM devices WHERE id = ?").get(id);
  return NextResponse.json(updated);
}

// DELETE /api/devices/:id -> cihazı (ve ona bağlı bağlantıları) siler
export async function DELETE(_request, { params }) {
  const { id } = params;
  const existing = db.prepare("SELECT * FROM devices WHERE id = ?").get(id);
  if (!existing) {
    return NextResponse.json({ error: "Cihaz bulunamadı." }, { status: 404 });
  }

  db.prepare("DELETE FROM devices WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}