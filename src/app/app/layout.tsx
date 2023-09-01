import AppNavbar from "@/components/navbar/app";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col items-center pb-20 pt-[100px]">
      <AppNavbar />

      <div className="flex w-full max-w-3xl flex-col">{children}</div>
    </div>
  );
}
