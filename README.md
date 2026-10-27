# Ağ Envanter ve Kablolama Yönetim Sistemi

Bu proje, kurumların ağ altyapısındaki kabin, cihaz, patch panel ve kablo bağlantılarını görsel ve detaylı bir şekilde yönetmelerini sağlayan **Next.js** tabanlı bir envanter yönetim sistemidir.

## Özellikler
- **Sistem Odası Yönetimi:** U (Raf) bazlı kabin görünümü ve kapasite kontrolleri.
- **Topoloji Haritası:** ReactFlow ile otomatik çizilen, uçtan uca cihaz bağlantı haritası.
- **Port ve Kablo Takibi:** Patch panellerden odalara (prizlere) giden bağlantıların Switch'lerdeki karşılığını uçtan uca takip edebilme.
- **On-Premise Mimari:** SQLite kullanılarak kurum içi sunucularda çalışmaya uygun, güvenli veri saklama altyapısı.

## Kurulum (Local Development)

Projenin çalışması için bilgisayarınızda **Node.js** yüklü olmalıdır.

1. Proje bağımlılıklarını yükleyin:
```bash
npm install
```

2. Projeyi geliştirici modunda başlatın:
```bash
npm run dev
```

3. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## Kullanıcı Girişi (Admin Mode)

Projede varsayılan olarak Supabase Kimlik Doğrulama (Authentication) altyapısı kullanılmaktadır. Ancak proje yerel (local) ortamda incelenmek üzere indirildiğinde Supabase çevre değişkenleri (.env.local) olmadan da sistemi test edebilmeniz için yerel bir **Admin yetkisi** tanımlanmıştır.

Projeyi indirdikten sonra sisteme giriş yapmak için aşağıdaki bilgileri kullanabilirsiniz:

- **E-posta:** admin@admin.com
- **Şifre:** admin

## Teknolojiler
- **Frontend & Backend:** Next.js 14 (App Router)
- **Veritabanı:** better-sqlite3 (envanter.db)
- **Haritalandırma:** ReactFlow, Dagre
- **Grafikler:** Recharts
