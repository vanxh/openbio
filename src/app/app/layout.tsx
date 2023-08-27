import HomeButton from "@/components/home-button";
import LogoutButton from "@/components/logout-button";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col items-center pt-[100px]">
      <HomeButton />
      <LogoutButton />

      {children}
    </div>
  );
}
