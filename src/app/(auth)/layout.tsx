import HomeButton from "@/components/home-button";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex min-h-screen w-full items-center justify-center">
      <div className="flex w-full flex-col items-center justify-center">
        <HomeButton />

        {children}
      </div>
    </div>
  );
}
