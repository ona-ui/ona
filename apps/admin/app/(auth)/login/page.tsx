import { Suspense } from "react"
import LoginForm from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginForm />
    </Suspense>
  )
}