export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      approval_history: {
        Row: {
          changed_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_status: string
          notes: string | null
          previous_status: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_status: string
          notes?: string | null
          previous_status?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_status?: string
          notes?: string | null
          previous_status?: string | null
        }
        Relationships: []
      }
      contacts_log: {
        Row: {
          contact_type: string
          from_name: string | null
          from_phone: string | null
          id: string
          timestamp: string
          to_id: string
          to_type: string
        }
        Insert: {
          contact_type: string
          from_name?: string | null
          from_phone?: string | null
          id?: string
          timestamp?: string
          to_id: string
          to_type: string
        }
        Update: {
          contact_type?: string
          from_name?: string | null
          from_phone?: string | null
          id?: string
          timestamp?: string
          to_id?: string
          to_type?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          account_created_at: string
          approval_notes: string | null
          approval_status: string
          area: string
          created_at: string
          id: string
          last_updated_at: string
          name: string
          phone: string
          role: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          terms_version: string | null
        }
        Insert: {
          account_created_at?: string
          approval_notes?: string | null
          approval_status?: string
          area: string
          created_at?: string
          id?: string
          last_updated_at?: string
          name: string
          phone: string
          role?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
        }
        Update: {
          account_created_at?: string
          approval_notes?: string | null
          approval_status?: string
          area?: string
          created_at?: string
          id?: string
          last_updated_at?: string
          name?: string
          phone?: string
          role?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          photo_url: string | null
          price: number
          shop_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          photo_url?: string | null
          price?: number
          shop_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          price?: number
          shop_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          account_created_at: string
          approval_notes: string | null
          approval_status: string
          area: string
          business_hours: Json | null
          category: string
          description: string | null
          id: string
          last_updated_at: string
          owner_name: string
          phone: string
          photo_url: string | null
          rating: number
          registered_at: string
          shop_name: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          terms_version: string | null
          visibility: string
          whatsapp: string
        }
        Insert: {
          account_created_at?: string
          approval_notes?: string | null
          approval_status?: string
          area: string
          business_hours?: Json | null
          category: string
          description?: string | null
          id?: string
          last_updated_at?: string
          owner_name: string
          phone: string
          photo_url?: string | null
          rating?: number
          registered_at?: string
          shop_name: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
          visibility?: string
          whatsapp: string
        }
        Update: {
          account_created_at?: string
          approval_notes?: string | null
          approval_status?: string
          area?: string
          business_hours?: Json | null
          category?: string
          description?: string | null
          id?: string
          last_updated_at?: string
          owner_name?: string
          phone?: string
          photo_url?: string | null
          rating?: number
          registered_at?: string
          shop_name?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
          visibility?: string
          whatsapp?: string
        }
        Relationships: []
      }
      support_queries: {
        Row: {
          created_at: string
          id: string
          message: string
          name: string
          phone: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          name: string
          phone: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          account_created_at: string
          approval_notes: string | null
          approval_status: string
          area: string
          business_hours: Json | null
          description: string | null
          experience: number
          id: string
          job_type: string
          last_updated_at: string
          name: string
          phone: string
          photo_url: string | null
          rating: number
          registered_at: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          terms_version: string | null
          visibility: string
          whatsapp: string
        }
        Insert: {
          account_created_at?: string
          approval_notes?: string | null
          approval_status?: string
          area: string
          business_hours?: Json | null
          description?: string | null
          experience?: number
          id?: string
          job_type: string
          last_updated_at?: string
          name: string
          phone: string
          photo_url?: string | null
          rating?: number
          registered_at?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
          visibility?: string
          whatsapp: string
        }
        Update: {
          account_created_at?: string
          approval_notes?: string | null
          approval_status?: string
          area?: string
          business_hours?: Json | null
          description?: string | null
          experience?: number
          id?: string
          job_type?: string
          last_updated_at?: string
          name?: string
          phone?: string
          photo_url?: string | null
          rating?: number
          registered_at?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
          visibility?: string
          whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
