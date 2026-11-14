"use client";

import { useRouter } from "next/navigation";
import { authClient } from "./auth-client";

export function useKeluar() {
  const router = useRouter();
  return async () => {
    await authClient.signOut();
    router.push("/masuk");
    router.refresh();
  };
}