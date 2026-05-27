import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'AI チャット',
  description: 'Groq Llama 3.3 を使ったAIチャットアプリ',
}

// テーマのフラッシュ防止: hydration前にCSS変数を適用する
const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var config = saved ? JSON.parse(saved) : { mode: 'dark', accent: 'purple' };
    var modes = {
      dark:     { bg:'#0d0d10', surface:'#16161a', surface2:'#1e1e24', border:'rgba(255,255,255,0.07)', text:'#e8e8f0', textMuted:'#6b6b80', codeBg:'rgba(255,255,255,0.08)', preBg:'rgba(0,0,0,0.4)' },
      light:    { bg:'#f5f5f8', surface:'#ffffff',  surface2:'#ebebf0', border:'rgba(0,0,0,0.08)',       text:'#1a1a2e', textMuted:'#888899', codeBg:'rgba(0,0,0,0.06)',         preBg:'rgba(0,0,0,0.04)' },
      midnight: { bg:'#000000', surface:'#0a0a0a',  surface2:'#111114', border:'rgba(255,255,255,0.05)', text:'#e0e0e8', textMuted:'#555565', codeBg:'rgba(255,255,255,0.06)',   preBg:'rgba(0,0,0,0.6)' },
    };
    var accents = {
      purple: { from:'#7c5cfc', to:'#4fa3f7', shadow:'rgba(124,92,252,0.3)' },
      blue:   { from:'#3b82f6', to:'#06b6d4', shadow:'rgba(59,130,246,0.3)' },
      green:  { from:'#10b981', to:'#34d399', shadow:'rgba(16,185,129,0.3)' },
      rose:   { from:'#f43f5e', to:'#fb923c', shadow:'rgba(244,63,94,0.3)' },
    };
    var m = modes[config.mode] || modes.dark;
    var a = accents[config.accent] || accents.purple;
    var r = document.documentElement;
    r.style.setProperty('--bg', m.bg);
    r.style.setProperty('--surface', m.surface);
    r.style.setProperty('--surface-2', m.surface2);
    r.style.setProperty('--border', m.border);
    r.style.setProperty('--text', m.text);
    r.style.setProperty('--text-muted', m.textMuted);
    r.style.setProperty('--code-bg', m.codeBg);
    r.style.setProperty('--pre-bg', m.preBg);
    r.style.setProperty('--accent', a.from);
    r.style.setProperty('--accent-2', a.to);
    r.style.setProperty('--accent-shadow', a.shadow);
    r.style.setProperty('--accent-grad', 'linear-gradient(135deg, ' + a.from + ', ' + a.to + ')');
  } catch(e) {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* テーマ初期化スクリプト（フラッシュ防止） */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
