import './globals.css';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

const inter = Inter({ subsets: ['latin'] });

const calSans = localFont({
  src: [
    {
      path: '../../public/fonts/CalSans-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  display: 'swap',
});

export const metadata = {
  title: 'ApplyPilot',
  description: '',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={calSans.className}>
      <body className={calSans.className}>
        {children}
      </body>
    </html>
  );
}