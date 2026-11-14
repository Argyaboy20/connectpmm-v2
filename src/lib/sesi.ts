import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";

export const ambilSesi = cache(async () => auth.api.getSession({ headers: await headers() }));