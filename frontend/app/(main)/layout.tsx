import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-screen-2xl mx-auto">
        <Navbar />
      </header>
      <main className="relative z-[1]">{children}</main>
      <footer className="sticky top-[100vh]">
        <Footer />
      </footer>
    </div>
  );
}
