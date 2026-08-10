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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agreements: {
        Row: {
          agreed_at: string
          id: string
          ip_address: unknown
          project_id: string
          terms_version: string
          usage_expires_at: string
          user_id: string
        }
        Insert: {
          agreed_at?: string
          id?: string
          ip_address?: unknown
          project_id: string
          terms_version: string
          usage_expires_at: string
          user_id: string
        }
        Update: {
          agreed_at?: string
          id?: string
          ip_address?: unknown
          project_id?: string
          terms_version?: string
          usage_expires_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          profile: Json
          profile_raw: Json | null
          source_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          profile?: Json
          profile_raw?: Json | null
          source_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          profile?: Json
          profile_raw?: Json | null
          source_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string
          final_drive_file_id: string | null
          id: string
          preview_path: string | null
          project_id: string
          seq: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          final_drive_file_id?: string | null
          id?: string
          preview_path?: string | null
          project_id: string
          seq: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          final_drive_file_id?: string | null
          id?: string
          preview_path?: string | null
          project_id?: string
          seq?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      drive_grants: {
        Row: {
          drive_folder_id: string
          drive_link: string
          expires_at: string
          granted_at: string
          id: string
          project_id: string
          revoked: boolean
        }
        Insert: {
          drive_folder_id: string
          drive_link: string
          expires_at: string
          granted_at?: string
          id?: string
          project_id: string
          revoked?: boolean
        }
        Update: {
          drive_folder_id?: string
          drive_link?: string
          expires_at?: string
          granted_at?: string
          id?: string
          project_id?: string
          revoked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "drive_grants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_posts: {
        Row: {
          content_url: string | null
          created_at: string
          follower_count: number | null
          handle: string
          id: string
          instagram_url: string | null
          post_count: number | null
          posted_at: string | null
          project_id: string
          snapshot_at: string | null
          thumbnail_url: string | null
        }
        Insert: {
          content_url?: string | null
          created_at?: string
          follower_count?: number | null
          handle: string
          id?: string
          instagram_url?: string | null
          post_count?: number | null
          posted_at?: string | null
          project_id: string
          snapshot_at?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          content_url?: string | null
          created_at?: string
          follower_count?: number | null
          handle?: string
          id?: string
          instagram_url?: string | null
          post_count?: number | null
          posted_at?: string | null
          project_id?: string
          snapshot_at?: string | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          biz_reg_number: string | null
          brand_profile_id: string | null
          created_at: string
          id: string
          paid_at: string | null
          plan_id: string
          status: string
          tax_invoice_email: string | null
          toss_order_id: string
          toss_payment_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          biz_reg_number?: string | null
          brand_profile_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          plan_id: string
          status?: string
          tax_invoice_email?: string | null
          toss_order_id: string
          toss_payment_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          biz_reg_number?: string | null
          brand_profile_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          plan_id?: string
          status?: string
          tax_invoice_email?: string | null
          toss_order_id?: string
          toss_payment_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          beta_price: number
          code: string
          composition: string
          created_at: string
          head_review: boolean
          id: string
          influencer_count: number
          label: string
          list_price: number
          recommended: boolean
          shorts_count: number
          sort_order: number
          tier: string
        }
        Insert: {
          active?: boolean
          beta_price: number
          code: string
          composition: string
          created_at?: string
          head_review?: boolean
          id?: string
          influencer_count?: number
          label: string
          list_price: number
          recommended?: boolean
          shorts_count: number
          sort_order?: number
          tier: string
        }
        Update: {
          active?: boolean
          beta_price?: number
          code?: string
          composition?: string
          created_at?: string
          head_review?: boolean
          id?: string
          influencer_count?: number
          label?: string
          list_price?: number
          recommended?: boolean
          shorts_count?: number
          sort_order?: number
          tier?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string
          contact_name: string
          created_at: string
          email: string | null
          id: string
          job_title: string | null
          marketing_opt_in: boolean
          phone: string | null
          role: string
          signup_completed: boolean
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_name: string
          created_at?: string
          email?: string | null
          id: string
          job_title?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          role?: string
          signup_completed?: boolean
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          job_title?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          role?: string
          signup_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          brand_profile_id: string | null
          campaign_input: Json
          created_at: string
          guideline_ai: Json | null
          guideline_confirmed_at: string | null
          head_review_status: string | null
          id: string
          order_id: string
          recruit_deadline: string | null
          stage_a: string | null
          stage_b: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_profile_id?: string | null
          campaign_input?: Json
          created_at?: string
          guideline_ai?: Json | null
          guideline_confirmed_at?: string | null
          head_review_status?: string | null
          id?: string
          order_id: string
          recruit_deadline?: string | null
          stage_a?: string | null
          stage_b?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_profile_id?: string | null
          campaign_input?: Json
          created_at?: string
          guideline_ai?: Json | null
          guideline_confirmed_at?: string | null
          head_review_status?: string | null
          id?: string
          order_id?: string
          recruit_deadline?: string | null
          stage_a?: string | null
          stage_b?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_requests: {
        Row: {
          created_at: string
          deliverable_id: string
          id: string
          message: string
          round: number
          user_id: string
        }
        Insert: {
          created_at?: string
          deliverable_id: string
          id?: string
          message: string
          round?: number
          user_id: string
        }
        Update: {
          created_at?: string
          deliverable_id?: string
          id?: string
          message?: string
          round?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_requests_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          agreed: boolean
          agreed_at: string
          id: string
          ip_address: unknown
          kind: string
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          agreed: boolean
          agreed_at?: string
          id?: string
          ip_address?: unknown
          kind: string
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          agreed?: boolean
          agreed_at?: string
          id?: string
          ip_address?: unknown
          kind?: string
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
