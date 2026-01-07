import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}): Promise<React.JSX.Element> {
  const { error } = await searchParams;

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: "Server Configuration Error",
      description: "There is a problem with the server configuration. Please contact support.",
    },
    AccessDenied: {
      title: "Access Denied",
      description: "You do not have permission to sign in.",
    },
    Verification: {
      title: "Verification Failed",
      description: "The verification token has expired or has already been used.",
    },
    OAuthAccountNotLinked: {
      title: "Account Already Exists",
      description: "This email is already associated with another account. Please sign in with your original provider.",
    },
    Default: {
      title: "Authentication Error",
      description: "An unexpected error occurred during authentication. Please try again.",
    },
  }

  const errorInfo = errorMessages[error || "Default"] || errorMessages.Default

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-base">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button asChild className="w-full" size="lg">
              <Link href="/auth/signin">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
          
          {error && (
            <p className="text-center text-xs text-muted-foreground">
              Error code: {error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
