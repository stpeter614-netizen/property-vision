import "./globals.css";
export const metadata = { title: "Property Vision", description: "Experience Property Before It Exists." };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}