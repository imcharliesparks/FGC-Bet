import { authMiddleware } from "@clerk/nextjs";

export const proxy = authMiddleware({
  publicRoutes: ["/", "/matches", "/tournaments", "/sign-in", "/sign-up"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
