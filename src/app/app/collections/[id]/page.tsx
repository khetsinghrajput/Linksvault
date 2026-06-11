'use client'

import { use } from 'react'
import { BookmarksPage } from '@/components/app/bookmarks-page'

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <BookmarksPage title="Collection" filter="collection" collectionId={id} />
}
