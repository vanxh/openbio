import HomeButton from "@/components/home-button";
import AppButton from "@/components/app-button";
import Footer from "@/components/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col items-center justify-center py-4 md:py-8">
      <HomeButton />
      <AppButton />

      <div className="flex flex-1 flex-col items-center justify-center">
        {children}
      </div>

      <Footer />
    </div>
  );
}
