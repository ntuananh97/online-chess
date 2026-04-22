import { PlayPageClient } from './PlayPageClient'

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PlayPageClient roomId={id} />
}
