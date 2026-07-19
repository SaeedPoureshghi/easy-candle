import "./globals.css";

export const metadata = {
  title: "Easy Candle",
  description: "Candlestick chart replay for Easy Candle",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
