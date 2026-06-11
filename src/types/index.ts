import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Collection = Database['public']['Tables']['collections']['Row']
export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type BookmarkTag = Database['public']['Tables']['bookmark_tags']['Row']
export type Highlight = Database['public']['Tables']['highlights']['Row']
export type CollectionMember = Database['public']['Tables']['collection_members']['Row']

export type BookmarkWithTags = Bookmark & {
  tags: Tag[]
  highlights?: Highlight[]
}

export type CollectionWithChildren = Collection & {
  children?: CollectionWithChildren[]
  bookmark_count?: number
}

export type ViewMode = 'list' | 'grid' | 'compact' | 'masonry'
export type SortMode = 'newest' | 'oldest' | 'title' | 'domain' | 'manual'

export type SmartCollection = 'all' | 'favorites' | 'archive' | 'trash'

export type BookmarkType = 'link' | 'article' | 'video' | 'image' | 'pdf' | 'file'

export interface UrlMetadata {
  url: string
  canonical_url: string | null
  normalized_url: string
  title: string
  description: string | null
  site_name: string | null
  domain: string
  favicon_url: string | null
  image_url: string | null
  type: BookmarkType
}

export interface ActionResult<T = void> {
  data?: T
  error?: string
}
