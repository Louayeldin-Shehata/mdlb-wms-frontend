import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ token, req }) {
      if (!token) return false;

      const pathname = req.nextUrl.pathname;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = (token as any).role as string | undefined;

      if (pathname.startsWith("/admin")) return role === "ADMIN";
      if (pathname.startsWith("/crew")) return role === "CREW" || role === "ADMIN";

      return true;
    },
  },
});

export const config = { matcher: ["/admin/:path*", "/crew/:path*"] };

