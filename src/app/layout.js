import "./globals.css"

export const metadata = {
  title: "Sun-Fun | Play Together",
  description: "Create groups. Vote topics. Play AI-powered multiplayer games."
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F19] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
