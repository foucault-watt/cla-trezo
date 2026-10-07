import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

// Route cachée pour lancer `prisma migrate deploy` depuis le conteneur de
// prod, à appeler manuellement après un déploiement quand on n'a pas accès
// à un shell sur le serveur. Protégée par MIGRATE_TOKEN (query param
// `token`) : si la variable n'est pas définie, la route répond 404 comme si
// elle n'existait pas.
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

export async function GET(request: NextRequest) {
  const expectedToken = process.env.MIGRATE_TOKEN;
  if (!expectedToken) {
    return new NextResponse(null, { status: 404 });
  }

  const token = request.nextUrl.searchParams.get("token");
  if (token !== expectedToken) {
    return new NextResponse(null, { status: 404 });
  }

  // En prod, l'image Docker n'embarque que les paquets utiles à l'app : la
  // CLI Prisma est installée à part avec le schéma et les migrations, dans le
  // dossier indiqué par PRISMA_CLI_DIR (cf. Dockerfile). Sans la variable, on
  // utilise le projet courant.
  const prismaDir = process.env.PRISMA_CLI_DIR ?? process.cwd();
  const prismaCli = path.join(
    prismaDir,
    "node_modules",
    "prisma",
    "build",
    "index.js",
  );

  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [prismaCli, "migrate", "deploy"],
      { cwd: prismaDir, env: process.env, timeout: 120_000 },
    );
    console.log("[MIGRATE] prisma migrate deploy OK :", stdout, stderr);
    return NextResponse.json({ ok: true, stdout, stderr });
  } catch (error) {
    console.error("[MIGRATE] Échec de prisma migrate deploy :", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
