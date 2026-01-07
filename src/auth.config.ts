
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      
      // Define protected routes
      const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard') ||
                              nextUrl.pathname.startsWith('/api/files')
      
      // Define auth routes
      const isAuthRoute = nextUrl.pathname.startsWith('/auth/signin') ||
                         nextUrl.pathname.startsWith('/auth/signup')
      
      // Redirect to signin if accessing protected route while not logged in
      if (isProtectedRoute && !isLoggedIn) {
        return false // Redirect to signin handled by NextAuth automatically or we can return Response
      }
      
      // Redirect to dashboard if accessing auth routes while logged in
      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      
      return true
    },
  },
} satisfies NextAuthConfig
