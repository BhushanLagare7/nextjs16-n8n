import { requireAuth } from "@/lib/auth-utils"

interface CredentialIdPageProps {
  params: Promise<{ credentialId: string }>
}

/**
 * Displays details for a single credential (protected route)
 */
export default async function CredentialIdPage({
  params,
}: CredentialIdPageProps) {
  await requireAuth()

  const { credentialId } = await params

  return <div>Credential Id Page: {credentialId}</div>
}
