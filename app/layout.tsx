import type { ReactNode } from "react";

export const metadata = {
  title: "Larson Box Spread Financing",
  description: "Internal deterministic box-spread financing platform"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
