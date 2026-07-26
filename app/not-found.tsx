import { Compass } from "lucide-react";
import { NotFoundCountdown } from "@/components/theme/not-found-countdown";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-base-200 px-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass size={40} />
      </div>
      <h1 className="text-4xl font-bold sm:text-5xl">Vous vous êtes perdu</h1>
      <p className="max-w-md text-lg text-base-content/70">
        Cette page n&apos;existe pas.
      </p>
      <NotFoundCountdown />
    </div>
  );
}
