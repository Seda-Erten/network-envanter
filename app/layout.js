import "./globals.css";

export const metadata = {
  title: "Ağ Envanteri",
  description: "Switch, port ve kablo bağlantılarını takip eden envanter sistemi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
