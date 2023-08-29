import Link from "next/link";

export default function HomeFooter() {
  const footerLinks = {
    Developer: [
      {
        href: "https://twitter.com/vanxhh",
        label: "Twitter",
      },
    ],
    Links: [
      {
        href: "https://github.com/vanxh/openbio",
        label: "Github",
      },
    ],
    Resources: [
      {
        href: "https://openbio.openstatus.dev",
        label: "Status",
      },
    ],
    Company: [
      {
        href: "mailto:vanxh@openbio.app?subject=Need%20help%20with%20OpenBio",
        label: "Support",
      },
      {
        href: "/legal/privacy",
        label: "Privacy Policy",
      },
      {
        href: "/legal/terms",
        label: "Terms of Service",
      },
    ],
  };

  return (
    <footer className="supports-backdrop-blur:bg-background/60 bottom-0 grid w-full max-w-3xl grid-cols-2 gap-6 rounded-lg border border-border bg-background/95 p-4 backdrop-blur md:grid-cols-4 md:p-6">
      {Object.keys(footerLinks).map((key) => (
        <div key={key} className="flex flex-col gap-y-3 text-sm">
          <p className="font-semibold">{key}</p>

          {footerLinks[key as keyof typeof footerLinks].map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </div>
      ))}
    </footer>
  );
}

const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  const isExternal = href.startsWith("http");

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="text-muted-foreground underline hover:text-foreground hover:no-underline"
    >
      {children}
    </Link>
  );
};
