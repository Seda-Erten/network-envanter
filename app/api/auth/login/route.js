import db from "@/lib/db";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre zorunludur." }, { status: 400 });
  }

  // Yerel Admin Girişi (Supabase olmadan projenin incelenebilmesi için)
  if (email === "admin@admin.com" && password === "admin") {
    const response = NextResponse.json({ success: true, user_id: "local_admin" });
    response.cookies.set("userId", "local_admin", { path: '/' });
    return response;
  }

  if (!supabase) {
    return NextResponse.json({ error: "Supabase yapılandırması eksik. Lütfen README.md dosyasını inceleyin." }, { status: 400 });
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Hatalı e-posta veya şifre." }, { status: 401 });
  }

  const supabaseId = authData.user.id;

  let user = db.prepare("SELECT * FROM users WHERE supabase_id = ?").get(supabaseId);

  if (!user) {
    const username = email.split('@')[0];
    const stmt = db.prepare("INSERT INTO users (username, password_hash, supabase_id) VALUES (@username, @password_hash, @supabase_id)");
    const result = stmt.run({ 
      username: username, 
      password_hash: "SUPABASE_AUTH",
      supabase_id: supabaseId 
    });
    user = { id: result.lastInsertRowid };
  }

  const response = NextResponse.json({ success: true, user_id: user.id });
  response.cookies.set("userId", user.id.toString(), { path: '/' });
  
  return response;
}