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
      analytics: {
        Row: {
          business_id: string
          five_star_clicks: number
          id: string
          low_star_submissions: number
          page_views: number
        }
        Insert: {
          business_id: string
          five_star_clicks?: number
          id?: string
          low_star_submissions?: number
          page_views?: number
        }
        Update: {
          business_id?: string
          five_star_clicks?: number
          id?: string
          low_star_submissions?: number
          page_views?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          bg_image_url: string | null
          business_name: string
          created_at: string
          enable_feedback_filter: boolean
          enable_predefined_reviews: boolean
          font_family: string | null
          google_review_url: string
          id: string
          logo_url: string | null
          primary_color: string | null
          slug: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bg_image_url?: string | null
          business_name: string
          created_at?: string
          enable_feedback_filter?: boolean
          enable_predefined_reviews?: boolean
          font_family?: string | null
          google_review_url: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          slug: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bg_image_url?: string | null
          business_name?: string
          created_at?: string
          enable_feedback_filter?: boolean
          enable_predefined_reviews?: boolean
          font_family?: string | null
          google_review_url?: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          slug?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      negative_feedback: {
        Row: {
          business_id: string
          created_at: string
          customer_name: string
          customer_phone: string
          feedback_text: string
          id: string
          rating: number
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          feedback_text: string
          id?: string
          rating: number
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          feedback_text?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "negative_feedback_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_view_logs: {
        Row: {
          business_id: string
          city: string | null
          country: string | null
          device_type: string | null
          id: string
          source: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          business_id: string
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          source?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          business_id?: string
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          source?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_view_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          is_renewal: boolean
          plan_id: string | null
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          is_renewal?: boolean
          plan_id?: string | null
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          is_renewal?: boolean
          plan_id?: string | null
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          badge: string | null
          created_at: string
          description: string
          id: string
          is_active: boolean
          max_reviews: number
          max_segments: number
          name: string
          price: number
          theme_access: string[]
          updated_at: string
          validity_days: number
        }
        Insert: {
          badge?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          max_reviews?: number
          max_segments?: number
          name: string
          price?: number
          theme_access?: string[]
          updated_at?: string
          validity_days?: number
        }
        Update: {
          badge?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          max_reviews?: number
          max_segments?: number
          name?: string
          price?: number
          theme_access?: string[]
          updated_at?: string
          validity_days?: number
        }
        Relationships: []
      }
      positive_reviews: {
        Row: {
          business_id: string
          created_at: string
          id: string
          review_text: string
          segment_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          review_text: string
          segment_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          review_text?: string
          segment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positive_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positive_reviews_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "review_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      review_segments: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_segments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          assigned_at: string
          expires_at: string
          id: string
          plan_id: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          expires_at: string
          id?: string
          plan_id?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          expires_at?: string
          id?: string
          plan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_copied_review: {
        Args: { p_business_id: string; p_review_id: string }
        Returns: undefined
      }
      get_public_business: {
        Args: { p_slug: string }
        Returns: {
          bg_image_url: string
          business_name: string
          enable_feedback_filter: boolean
          enable_predefined_reviews: boolean
          google_review_url: string
          id: string
          logo_url: string
          primary_color: string
        }[]
      }
      get_public_reviews: {
        Args: { p_business_id: string }
        Returns: {
          id: string
          review_text: string
          segment_id: string
        }[]
      }
      get_public_segments: {
        Args: { p_business_id: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_analytics: {
        Args: { p_business_id: string; p_column: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      log_page_view: {
        Args: {
          p_business_id: string
          p_city?: string
          p_country?: string
          p_device_type?: string
          p_source?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      submit_negative_feedback:
        | {
            Args: {
              p_business_id: string
              p_feedback_text: string
              p_rating: number
            }
            Returns: undefined
          }
        | {
            Args: {
              p_business_id: string
              p_customer_name?: string
              p_customer_phone?: string
              p_feedback_text: string
              p_rating: number
            }
            Returns: undefined
          }
    }
    Enums: {
      app_role: "admin" | "client" | "super_admin" | "reseller"
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
      app_role: ["admin", "client", "super_admin", "reseller"],
    },
  },
} as const
