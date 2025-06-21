"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Page 1", href: "/page1" },
    { label: "Page 2", href: "/page2" },
  ];

  return (
    <nav className=" px-6 py-10">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-8">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-base font-medium transition-colors ${
              pathname === item.href ? "text-yellow-400" : "text-white hover:text-yellow-300"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
