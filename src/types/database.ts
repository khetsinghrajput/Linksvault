export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          id: string
          user_id: string
          parent_id: string | null
          name: string
          description: string | null
          icon: string | null
          color: string | null
          view_mode: string
          sort_order: number
          is_public: boolean
          public_slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_id?: string | null
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          view_mode?: string
          sort_order?: number
          is_public?: boolean
          public_slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parent_id?: string | null
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          view_mode?: string
          sort_order?: number
          is_public?: boolean
          public_slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          collection_id: string | null
          url: string
          canonical_url: string | null
          normalized_url: string | null
          title: string
          description: string | null
          note: string | null
          site_name: string | null
          domain: string | null
          favicon_url: string | null
          image_url: string | null
          type: string
          storage_path: string | null
          mime_type: string | null
          file_size: number | null
          is_favorite: boolean
          is_archived: boolean
          is_deleted: boolean
          is_broken: boolean
          reminder_at: string | null
          last_checked_at: string | null
          deleted_at: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          collection_id?: string | null
          url: string
          canonical_url?: string | null
          normalized_url?: string | null
          title: string
          description?: string | null
          note?: string | null
          site_name?: string | null
          domain?: string | null
          favicon_url?: string | null
          image_url?: string | null
          type?: string
          storage_path?: string | null
          mime_type?: string | null
          file_size?: number | null
          is_favorite?: boolean
          is_archived?: boolean
          is_deleted?: boolean
          is_broken?: boolean
          reminder_at?: string | null
          last_checked_at?: string | null
          deleted_at?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          collection_id?: string | null
          url?: string
          canonical_url?: string | null
          normalized_url?: string | null
          title?: string
          description?: string | null
          note?: string | null
          site_name?: string | null
          domain?: string | null
          favicon_url?: string | null
          image_url?: string | null
          type?: string
          storage_path?: string | null
          mime_type?: string | null
          file_size?: number | null
          is_favorite?: boolean
          is_archived?: boolean
          is_deleted?: boolean
          is_broken?: boolean
          reminder_at?: string | null
          last_checked_at?: string | null
          deleted_at?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      bookmark_tags: {
        Row: {
          bookmark_id: string
          tag_id: string
        }
        Insert: {
          bookmark_id: string
          tag_id: string
        }
        Update: {
          bookmark_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      highlights: {
        Row: {
          id: string
          user_id: string
          bookmark_id: string
          text: string
          color: string
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bookmark_id: string
          text: string
          color?: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bookmark_id?: string
          text?: string
          color?: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      collection_members: {
        Row: {
          id: string
          collection_id: string
          user_id: string | null
          email: string | null
          role: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          user_id?: string | null
          email?: string | null
          role: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          user_id?: string | null
          email?: string | null
          role?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
