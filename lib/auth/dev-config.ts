type DevAuthEnvironment = {
  NODE_ENV?: string;
  DEV_AUTH_BYPASS?: string;
};

export function isDevAuthBypassEnabled(
  environment: DevAuthEnvironment = process.env,
): boolean {
  return (
    environment.NODE_ENV !== "production" &&
    environment.DEV_AUTH_BYPASS === "true"
  );
}

export function normalizeDevAuthRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app/admin";
  }

  if (value.includes("\\")) {
    return "/app/admin";
  }

  return value;
}
