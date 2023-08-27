import HomeButton from "@/components/home-button";
import AppButton from "@/components/app-button";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col items-center justify-center">
      <HomeButton />
      <AppButton />

      {children}
    </div>
  );
}
