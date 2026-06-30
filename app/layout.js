import './globals.css';

export const metadata = {
  title: 'NutriMate — Smart Diet Planner for Students',
  description: 'AI-powered diet planning tailored to your mess menu, budget, and goals.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
