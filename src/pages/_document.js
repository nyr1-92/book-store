// src/pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#9333ea" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/192.png" />
        
        
        {/* iOS Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BookLens" />
        
        {/* Description */}
        <meta name="description" content="Scan book covers and get instant spoiler-free summaries powered by AI" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}