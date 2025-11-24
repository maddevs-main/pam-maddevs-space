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
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta name="theme-color" content="#1A1A1A" />
      </head>
      <body>
        {/* Use client component for loader logic */}
        <SessionLoaderWrapper>
          <Providers>{children}</Providers>
        </SessionLoaderWrapper>
      </body>
    </html>
  );
}

// Import client loader wrapper
import SessionLoaderWrapper from '../components/SessionLoaderWrapper';