import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export class ServerFetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ServerFetchError";
    this.status = status;
  }
}

export const isNextRedirectError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const redirectError = error as { digest?: string; message?: string };
  return (
    redirectError.digest?.includes("NEXT_REDIRECT") ||
    redirectError.message?.includes("NEXT_REDIRECT")
  );
};

/** Server-side requests go through the Next.js /api rewrite so cookies stay on the app origin. */
function getServerApiBase(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/api`;
}

export async function getServerAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    redirect("/login?session=expired");
  }

  try {
    const res = await fetch(`${getServerApiBase()}/auth/refresh-token`, {
      method: "POST",
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      redirect("/login?session=expired");
    }

    const data = await res.json();
    return data.accessToken;
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error("Server-side token refresh failed:", error);
    redirect("/login?session=expired");
  }
}

export async function serverFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getServerAuthToken();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(`${getServerApiBase()}${normalizedPath}`, {
    ...options,
    headers,
    cache: "no-store",
    next: { revalidate: 0, ...options.next },
  });

  if (!res.ok) {
    let message = `Server fetch failed for ${path}: ${res.statusText}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {
      // Keep default message when response body is not JSON.
    }
    throw new ServerFetchError(message, res.status);
  }

  const payload = await res.json();
  return payload.data;
}
