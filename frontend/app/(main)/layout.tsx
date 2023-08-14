import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <header className="bg-white max-w-screen-2xl mx-auto">
        <Navbar />
      </header>
      <main>{children}</main>
      <footer className="sticky top-[100vh]">
        <Footer />
      </footer>
    </div>
  );
}
