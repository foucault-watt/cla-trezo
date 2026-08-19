import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Image
        src="/web-app-manifest-512x512.png"
        alt="CLA Trézo"
        width={96}
        height={96}
        priority
        className="rounded-2xl"
      />
      <h1 className="text-3xl font-semibold">Trésorerie des associations</h1>
      <p className="max-w-md text-base-content/70">
        Suivi des soldes, subventions et notes de frais des associations de
        l&apos;école.
      </p>
      <Link href="/login" className="btn btn-primary">
        Se connecter
      </Link>
    </div>
  );
}
