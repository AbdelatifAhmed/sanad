import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getServerAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    redirect("/login?session=expired");
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Cookie": `refreshToken=${refreshToken}`,
      },
    });

    if (!res.ok) {
      redirect("/login?session=expired");
    }

    const data = await res.json();
    return data.accessToken;
  } catch (error) {
    console.error("Server-side token refresh failed:", error);
    redirect("/login?session=expired");
  }
}

export async function serverFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getServerAuthToken();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(`${baseUrl}/api${path}`, {
    ...options,
    headers,
    next: { revalidate: 0, ...options.next },
  });

  if (!res.ok) {
    throw new Error(`Server fetch failed for ${path}: ${res.statusText}`);
  }

  const payload = await res.json();
  return payload.data;
}
