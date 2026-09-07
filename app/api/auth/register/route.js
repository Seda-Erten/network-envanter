import db from "@/lib/db";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre zorunludur." }, { status: 400 });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const supabaseId = authData.user.id;

    const username = email.split('@')[0];
    
    const stmt = db.prepare("INSERT INTO users (username, password_hash, supabase_id) VALUES (@username, @password_hash, @supabase_id)");
    const result = stmt.run({ 
      username: username, 
      password_hash: "SUPABASE_AUTH", 
      supabase_id: supabaseId 
    });
    
    const response = NextResponse.json({ success: true, user_id: result.lastInsertRowid });
    response.cookies.set("userId", result.lastInsertRowid.toString(), { path: '/' });
    
    return response;
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json({ error: "Bu e-posta veya kullanıcı adı zaten alınmış." }, { status: 400 });
    }
    return NextResponse.json({ error: "Kayıt olurken yerel veritabanında bir hata oluştu." }, { status: 500 });
  } 
}