import MarketingFooter from "@/components/footer/marketing";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col items-center gap-y-6 pb-16 pt-16">
      {children}

      <div className="mt-auto" />

      <MarketingFooter />
    </div>
  );
}
