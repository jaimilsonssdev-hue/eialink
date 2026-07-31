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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          bio_page_id: string
          created_at: string
          device: string | null
          event_type: string
          id: string
          referrer: string | null
          target_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          bio_page_id: string
          created_at?: string
          device?: string | null
          event_type: string
          id?: string
          referrer?: string | null
          target_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          bio_page_id?: string
          created_at?: string
          device?: string | null
          event_type?: string
          id?: string
          referrer?: string | null
          target_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_bio_page_id_fkey"
            columns: ["bio_page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_links: {
        Row: {
          active: boolean
          bio_page_id: string
          created_at: string
          icon: string | null
          id: string
          position: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          bio_page_id: string
          created_at?: string
          icon?: string | null
          id?: string
          position?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          bio_page_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          position?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_links_bio_page_id_fkey"
            columns: ["bio_page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_pages: {
        Row: {
          avatar_url: string | null
          cover_fit: string
          cover_overlay: boolean
          cover_overlay_opacity: number
          cover_position: string
          cover_url: string | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          instagram: string | null
          pix_key: string | null
          published: boolean
          slug: string
          social_links: Json
          template_id: string | null
          theme: string
          updated_at: string
          user_id: string
          whatsapp: string | null
          whatsapp_button_label: string | null
          whatsapp_button_subtitle: string | null
          whatsapp_message: string | null
        }
        Insert: {
          avatar_url?: string | null
          cover_fit?: string
          cover_overlay?: boolean
          cover_overlay_opacity?: number
          cover_position?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          instagram?: string | null
          pix_key?: string | null
          published?: boolean
          slug: string
          social_links?: Json
          template_id?: string | null
          theme?: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
          whatsapp_button_label?: string | null
          whatsapp_button_subtitle?: string | null
          whatsapp_message?: string | null
        }
        Update: {
          avatar_url?: string | null
          cover_fit?: string
          cover_overlay?: boolean
          cover_overlay_opacity?: number
          cover_position?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          instagram?: string | null
          pix_key?: string | null
          published?: boolean
          slug?: string
          social_links?: Json
          template_id?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
          whatsapp_button_label?: string | null
          whatsapp_button_subtitle?: string | null
          whatsapp_message?: string | null
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          active: boolean
          bio_page_id: string
          button_label: string
          button_url: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          position: number
          price: number | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio_page_id: string
          button_label?: string
          button_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          position?: number
          price?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio_page_id?: string
          button_label?: string
          button_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          position?: number
          price?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_bio_page_id_fkey"
            columns: ["bio_page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_blocks: {
        Row: {
          bio_page_id: string
          created_at: string
          data: Json
          enabled: boolean
          id: string
          position: number
          type: string
          updated_at: string
        }
        Insert: {
          bio_page_id: string
          created_at?: string
          data?: Json
          enabled?: boolean
          id?: string
          position?: number
          type: string
          updated_at?: string
        }
        Update: {
          bio_page_id?: string
          created_at?: string
          data?: Json
          enabled?: boolean
          id?: string
          position?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_blocks_bio_page_id_fkey"
            columns: ["bio_page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          billing_interval: string
          created_at: string
          description: string | null
          features: Json
          id: string
          limits: Json
          name: string
          position: number
          price_cents: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_interval?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          limits?: Json
          name: string
          position?: number
          price_cents?: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_interval?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          limits?: Json
          name?: string
          position?: number
          price_cents?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      professional_services: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          position: number
          slug: string
          title: string
          updated_at: string
          whatsapp_message: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          id?: string
          position?: number
          slug: string
          title: string
          updated_at?: string
          whatsapp_message?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          position?: number
          slug?: string
          title?: string
          updated_at?: string
          whatsapp_message?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          company_name: string
          created_at: string
          email: string
          full_name: string
          has_website: boolean | null
          id: string
          instagram: string | null
          lead_score: number
          lgpd_accepted_at: string | null
          main_goal: string | null
          niche: string | null
          state: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          city?: string | null
          company_name: string
          created_at?: string
          email: string
          full_name: string
          has_website?: boolean | null
          id: string
          instagram?: string | null
          lead_score?: number
          lgpd_accepted_at?: string | null
          main_goal?: string | null
          niche?: string | null
          state?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          city?: string | null
          company_name?: string
          created_at?: string
          email?: string
          full_name?: string
          has_website?: boolean | null
          id?: string
          instagram?: string | null
          lead_score?: number
          lgpd_accepted_at?: string | null
          main_goal?: string | null
          niche?: string | null
          state?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          bio_page_id: string | null
          created_at: string
          id: string
          message: string | null
          notes: string | null
          professional_service_id: string | null
          service_type: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          bio_page_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          notes?: string | null
          professional_service_id?: string | null
          service_type: string
          source?: string
          status?: string
          user_id: string
        }
        Update: {
          bio_page_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          notes?: string | null
          professional_service_id?: string | null
          service_type?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_bio_page_id_fkey"
            columns: ["bio_page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_professional_service_id_fkey"
            columns: ["professional_service_id"]
            isOneToOne: false
            referencedRelation: "professional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_interval: string
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          id: string
          notes: string | null
          plan_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_interval?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_interval?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_payment_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin"
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
      app_role: ["user", "admin"],
    },
  },
} as const
