import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex justify-center px-3 py-8 sm:px-4 sm:py-16">
      <SignUp />
    </div>
  )
}
