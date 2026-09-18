import "./globals.css";

export const metadata = {
  title: "M&A Strategic Rationale Diagnostic",
  description: "A structured diagnostic for testing the coherence and support behind an M&A deal rationale."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
