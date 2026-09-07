import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const userId = request.cookies.get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const devices = db
    .prepare("SELECT * FROM devices WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId);
  return NextResponse.json(devices);
}

export async function POST(request) {
  const body = await request.json();
  const { name, type, location, ip_address, mac_address, brand, rack_id, rack_u, port_count, size_u, status } = body;



  const userId = request.cookies.get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Cihaz adı zorunludur." },
      { status: 400 }
    );
  }

  if (rack_id && rack_u) {
    const rack = db.prepare("SELECT size_u FROM racks WHERE id = ?").get(parseInt(rack_id));
    if (rack) {
      if (parseInt(rack_u) > rack.size_u || parseInt(rack_u) < 1) {
        return NextResponse.json(
          { error: `Bu dolap maksimum ${rack.size_u}U kapasiteye sahip. Lütfen 1 ile ${rack.size_u} arası bir raf girin.` },
          { status: 400 }
        );
      }
    }

    // Çakışma kontrolü (Kendi kapladığı tüm U alanları için)
    const deviceSize = parseInt(size_u) || 1;
    if (parseInt(rack_u) - deviceSize + 1 < 1) {
      return NextResponse.json(
        { error: `Cihaz ${deviceSize}U boyutunda. Bu rafa sığmıyor.` },
        { status: 400 }
      );
    }
    for (let i = 0; i < deviceSize; i++) {
      const checkU = parseInt(rack_u) - i;
      const existingSlot = db.prepare("SELECT name FROM devices WHERE rack_id = ? AND (? <= rack_u AND ? > rack_u - size_u) AND user_id = ?").get(parseInt(rack_id), checkU, checkU, userId);
      if (existingSlot) {
        return NextResponse.json(
          { error: `Bu dolabın ${checkU}U rafında zaten "${existingSlot.name}" isimli cihaz bulunuyor.` },
          { status: 400 }
        );
      }
    }
  }

  const stmt = db.prepare(
    `INSERT INTO devices (name, type, location, ip_address, mac_address, brand, rack_id, rack_u, port_count, size_u, status, user_id)
     VALUES (@name, @type, @location, @ip_address, @mac_address, @brand, @rack_id, @rack_u, @port_count, @size_u, @status, @user_id)`
  );

  const result = stmt.run({
    name: name.trim(),
    type: type || "diger",
    location: location || "",
    ip_address: ip_address || "",
    mac_address: mac_address || "",
    brand: brand || "",
    rack_id: rack_id ? parseInt(rack_id) : null,
    rack_u: rack_u ? parseInt(rack_u) : null,
    port_count: port_count ? parseInt(port_count) : 24,
    size_u: size_u ? parseInt(size_u) : 1,
    status: status || "aktif",
    user_id: userId,
  });

  const created = db
    .prepare("SELECT * FROM devices WHERE id = ?")
    .get(result.lastInsertRowid);

  return NextResponse.json(created, { status: 201 });
}