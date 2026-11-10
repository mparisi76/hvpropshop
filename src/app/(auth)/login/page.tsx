import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { getCurrentUser, userDisplayName } from "@/lib/currentUser";
import { logout } from "../logout-action";
import LoginForm from "./LoginForm";

/** Same-site path to continue to, or the dashboard. */
function safeNext(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login") ? value : "/dashboard";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return <LoginForm />;

  // Already signed in: say as whom, instead of silently continuing as that account
  const next = safeNext((await searchParams).next);
  return (
    <AuthCard
      title="You're already signed in"
      description={
        <>
          Signed in as <span className="font-medium text-neutral-900">{userDisplayName(user)}</span>
          {user.email && <> ({user.email})</>}.
        </>
      }
    >
      <div className="space-y-2">
        <Link href={next} className="btn-primary w-full">
          Continue as {user.first_name || userDisplayName(user)}
        </Link>
        <form action={logout}>
          <button type="submit" className="btn-secondary w-full">
            Sign in with a different account
          </button>
        </form>
      </div>
    </AuthCard>
  );
}
