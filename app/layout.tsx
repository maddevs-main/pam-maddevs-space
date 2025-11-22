import './globals.css';
import Providers from '../components/Providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1A1A1A" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}