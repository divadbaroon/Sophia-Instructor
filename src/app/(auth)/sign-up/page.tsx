import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import SignupClient from "./SignupClient"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return redirect("/")
  }

  const resolvedParams = await searchParams
  const message = resolvedParams.message as string | undefined

  return <SignupClient initialMessage={message} />
}