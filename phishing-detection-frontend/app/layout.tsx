"use client";
import { StyledRoot } from "./StyledRoot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <head>
        <title>RAG QnA</title>
      </head>
      <body>
        <StyledRoot>{children}</StyledRoot>
      </body>
    </html>
  );
}
