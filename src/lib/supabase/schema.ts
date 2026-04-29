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
      ghl_installations: {
        Row: {
          id: string
          company_id: string
          user_type: string
          access_token: string
          refresh_token: string
          token_type: string | null
          expires_at: string
          scopes: string[] | null
          raw_data: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          user_type: string
          access_token: string
          refresh_token: string
          token_type?: string | null
          expires_at: string
          scopes?: string[] | null
          raw_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          user_type?: string
          access_token?: string
          refresh_token?: string
          token_type?: string | null
          expires_at?: string
          scopes?: string[] | null
          raw_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ghl_location_tokens: {
        Row: {
          id: string
          installation_id: string | null
          location_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          installation_id?: string | null
          location_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          installation_id?: string | null
          location_id?: string
          access_token?: string
          refresh_token?: string
          expires_at?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bridge_keys: {
        Row: {
          id: string
          bridge_key: string
          installation_id: string | null
          company_id: string
          label: string | null
          is_active: boolean | null
          last_used_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          bridge_key: string
          installation_id?: string | null
          company_id: string
          label?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          bridge_key?: string
          installation_id?: string | null
          company_id?: string
          label?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      bridge_locations: {
        Row: {
          id: string
          bridge_key_id: string | null
          location_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          bridge_key_id?: string | null
          location_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          bridge_key_id?: string | null
          location_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          id: string
          location_id: string
          event_type: string
          payload: Json
          status: string | null
          attempts: number | null
          max_attempts: number | null
          next_retry_at: string | null
          error_message: string | null
          idempotency_key: string | null
          created_at: string | null
          processed_at: string | null
        }
        Insert: {
          id?: string
          location_id: string
          event_type: string
          payload: Json
          status?: string | null
          attempts?: number | null
          max_attempts?: number | null
          next_retry_at?: string | null
          error_message?: string | null
          idempotency_key?: string | null
          created_at?: string | null
          processed_at?: string | null
        }
        Update: {
          id?: string
          location_id?: string
          event_type?: string
          payload?: Json
          status?: string | null
          attempts?: number | null
          max_attempts?: number | null
          next_retry_at?: string | null
          error_message?: string | null
          idempotency_key?: string | null
          created_at?: string | null
          processed_at?: string | null
        }
        Relationships: []
      }
      webhook_subscriptions: {
        Row: {
          id: string
          location_id: string
          webhook_url: string
          event_types: string[]
          secret: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          location_id: string
          webhook_url: string
          event_types: string[]
          secret?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          location_id?: string
          webhook_url?: string
          event_types?: string[]
          secret?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      try_acquire_refresh_lock: {
        Args: {
          lock_key: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
