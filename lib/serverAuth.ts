import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getServerAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    redirect("/login?session=expired");
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/refresh-token", {
      method: "POST",
      headers: {
        "Cookie": `refreshToken=${refreshToken}`
      }
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
