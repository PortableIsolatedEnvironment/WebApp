import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";

const geistSans = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "My Pie",
  icons: {
    icon: "/pie_icon.png",
  },
  // description:
};

export default function RootLayout({ children }) {  
  const[searchQuery, setSearchQuery] = useState("");
  return (
    <html lang="en">
      <body>
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="container mx-auto px-4">
        {children}
        </main>
      </body>
    </html>
  );
}
