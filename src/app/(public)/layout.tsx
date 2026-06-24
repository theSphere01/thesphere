import PublicHeader from "@/components/layout/public-header";
import Footer from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main style={{ minHeight: "100vh" }} className="pb-nav md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <PWAInstallPrompt />
    </>
  );
}
