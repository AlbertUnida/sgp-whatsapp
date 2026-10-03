import { isPublicSignupAllowed } from "@/server/auth/registration";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  return <LoginForm signupOpen={await isPublicSignupAllowed()} />;
}
