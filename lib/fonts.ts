import { Inter, Norican } from "next/font/google";
import localFont from "next/font/local";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const fontHeading = localFont({
  src: "../assets/fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal-sans",
});

export const fontNorican = Norican({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});
