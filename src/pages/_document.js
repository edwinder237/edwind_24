import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <meta name="theme-color" content="#02174C" />
        <meta name="title" content="EDWIND - Advanced Training Management Platform" />
        <meta name="description" content="EDWIND empowers organizations with comprehensive training management solutions. Create courses, manage participants, track progress, and deliver exceptional educational experiences." />
        <meta name="keywords" content="training management, learning platform, course creation, participant tracking, education technology, corporate training, learning management system, EDWIND" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="EDWIND - Advanced Training Management Platform" />
        <meta property="og:description" content="Comprehensive training management solutions for organizations. Create courses, manage participants, and track educational progress." />
        <meta property="og:image" content="/assets/images/logos/edwind-color-logo.png" />
        <meta property="og:site_name" content="EDWIND" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="EDWIND - Advanced Training Management Platform" />
        <meta property="twitter:description" content="Comprehensive training management solutions for organizations. Create courses, manage participants, and track educational progress." />
        <meta property="twitter:image" content="/assets/images/logos/edwind-color-logo.png" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Lumeve" />

        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap&family=Public+Sans:wght@400;500;600;700"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
