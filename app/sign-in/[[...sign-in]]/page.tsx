import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex justify-center px-3 py-8 sm:px-4 sm:py-16">
      <SignIn />
    </div>
  )
}
