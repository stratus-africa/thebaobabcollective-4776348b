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
      adventures: {
        Row: {
          created_at: string
          deposit_usd: number
          description: string
          difficulty: string | null
          gallery: string[]
          highlights: string[]
          id: string
          image: string
          name: string
          nights: string | null
          price_from_usd: number | null
          published: boolean
          region: string | null
          slug: string
          sort_order: number
          tagline: string | null
          terrain: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_usd?: number
          description: string
          difficulty?: string | null
          gallery?: string[]
          highlights?: string[]
          id?: string
          image: string
          name: string
          nights?: string | null
          price_from_usd?: number | null
          published?: boolean
          region?: string | null
          slug: string
          sort_order?: number
          tagline?: string | null
          terrain?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_usd?: number
          description?: string
          difficulty?: string | null
          gallery?: string[]
          highlights?: string[]
          id?: string
          image?: string
          name?: string
          nights?: string | null
          price_from_usd?: number | null
          published?: boolean
          region?: string | null
          slug?: string
          sort_order?: number
          tagline?: string | null
          terrain?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      adventures_page_blocks: {
        Row: {
          created_at: string
          cta: Json
          hero: Json
          id: string
          philosophy: Json
          signatures: Json
          singleton: boolean
          styles: Json
          terrains: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          cta?: Json
          hero?: Json
          id?: string
          philosophy?: Json
          signatures?: Json
          singleton?: boolean
          styles?: Json
          terrains?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          cta?: Json
          hero?: Json
          id?: string
          philosophy?: Json
          signatures?: Json
          singleton?: boolean
          styles?: Json
          terrains?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      booking_notes: {
        Row: {
          author_id: string | null
          booking_id: string
          created_at: string
          id: string
          note: string
        }
        Insert: {
          author_id?: string | null
          booking_id: string
          created_at?: string
          id?: string
          note: string
        }
        Update: {
          author_id?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          deposit_usd: number
          guest_email: string
          guest_name: string
          guest_phone: string | null
          id: string
          itinerary_id: string | null
          itinerary_name: string
          party_size: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          total_estimate_usd: number | null
          travel_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deposit_usd?: number
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          id?: string
          itinerary_id?: string | null
          itinerary_name: string
          party_size?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_estimate_usd?: number | null
          travel_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deposit_usd?: number
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          id?: string
          itinerary_id?: string | null
          itinerary_name?: string
          party_size?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_estimate_usd?: number | null
          travel_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          best_season: string | null
          country: string
          created_at: string
          description: string
          featured_trips: string[]
          id: string
          image: string
          name: string
          published: boolean
          region: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          best_season?: string | null
          country: string
          created_at?: string
          description: string
          featured_trips?: string[]
          id?: string
          image: string
          name: string
          published?: boolean
          region: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          best_season?: string | null
          country?: string
          created_at?: string
          description?: string
          featured_trips?: string[]
          id?: string
          image?: string
          name?: string
          published?: boolean
          region?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          accommodation_style: string | null
          adults: number | null
          budget: string | null
          children: number | null
          created_at: string
          destination: string | null
          email: string
          experiences: string[] | null
          handled_at: string | null
          handled_by: string | null
          id: string
          message: string
          message_id: string | null
          name: string
          phone: string
          referral_source: string | null
          source_url: string | null
          status: string
          subject: string | null
          subscribe_newsletter: boolean
          travel_dates: string | null
          trip_type: string | null
        }
        Insert: {
          accommodation_style?: string | null
          adults?: number | null
          budget?: string | null
          children?: number | null
          created_at?: string
          destination?: string | null
          email: string
          experiences?: string[] | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message: string
          message_id?: string | null
          name: string
          phone: string
          referral_source?: string | null
          source_url?: string | null
          status?: string
          subject?: string | null
          subscribe_newsletter?: boolean
          travel_dates?: string | null
          trip_type?: string | null
        }
        Update: {
          accommodation_style?: string | null
          adults?: number | null
          budget?: string | null
          children?: number | null
          created_at?: string
          destination?: string | null
          email?: string
          experiences?: string[] | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message?: string
          message_id?: string | null
          name?: string
          phone?: string
          referral_source?: string | null
          source_url?: string | null
          status?: string
          subject?: string | null
          subscribe_newsletter?: boolean
          travel_dates?: string | null
          trip_type?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: Database["public"]["Enums"]["faq_category"]
          created_at: string
          id: string
          published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category: Database["public"]["Enums"]["faq_category"]
          created_at?: string
          id?: string
          published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: Database["public"]["Enums"]["faq_category"]
          created_at?: string
          id?: string
          published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          category_id: string
          created_at: string
          deposit_usd: number
          description: string
          highlights: string[]
          id: string
          image: string
          name: string
          nights: string
          price_from_usd: number | null
          published: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          deposit_usd?: number
          description: string
          highlights?: string[]
          id?: string
          image: string
          name: string
          nights: string
          price_from_usd?: number | null
          published?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          deposit_usd?: number
          description?: string
          highlights?: string[]
          id?: string
          image?: string
          name?: string
          nights?: string
          price_from_usd?: number | null
          published?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "journey_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_articles: {
        Row: {
          author: string | null
          category: string
          content: string[]
          created_at: string
          date: string
          excerpt: string
          id: string
          image: string
          published: boolean
          published_at: string | null
          read_time: string
          scheduled_at: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category: string
          content?: string[]
          created_at?: string
          date: string
          excerpt: string
          id?: string
          image: string
          published?: boolean
          published_at?: string | null
          read_time: string
          scheduled_at?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string
          content?: string[]
          created_at?: string
          date?: string
          excerpt?: string
          id?: string
          image?: string
          published?: boolean
          published_at?: string | null
          read_time?: string
          scheduled_at?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      journey_categories: {
        Row: {
          created_at: string
          hero_image: string
          id: string
          intro: string
          published: boolean
          slug: string
          sort_order: number
          tagline: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_image: string
          id?: string
          intro: string
          published?: boolean
          slug: string
          sort_order?: number
          tagline: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_image?: string
          id?: string
          intro?: string
          published?: boolean
          slug?: string
          sort_order?: number
          tagline?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lodges: {
        Row: {
          amenities: string[]
          created_at: string
          description: string
          gallery: string[]
          hero_image: string
          id: string
          location: string
          name: string
          price_from_usd: number | null
          published: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          created_at?: string
          description: string
          gallery?: string[]
          hero_image: string
          id?: string
          location: string
          name: string
          price_from_usd?: number | null
          published?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          created_at?: string
          description?: string
          gallery?: string[]
          hero_image?: string
          id?: string
          location?: string
          name?: string
          price_from_usd?: number | null
          published?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      planning_guide_requests: {
        Row: {
          created_at: string
          earliest_date: string | null
          email: string
          email_sent: boolean
          id: string
          interests: string[]
          message: string | null
          name: string
          pdf_url: string | null
          travelling_party: string | null
        }
        Insert: {
          created_at?: string
          earliest_date?: string | null
          email: string
          email_sent?: boolean
          id?: string
          interests?: string[]
          message?: string | null
          name: string
          pdf_url?: string | null
          travelling_party?: string | null
        }
        Update: {
          created_at?: string
          earliest_date?: string | null
          email?: string
          email_sent?: boolean
          id?: string
          interests?: string[]
          message?: string | null
          name?: string
          pdf_url?: string | null
          travelling_party?: string | null
        }
        Relationships: []
      }
      private_travel_requests: {
        Row: {
          budget_usd: string | null
          created_at: string
          destinations: string | null
          email: string
          full_name: string
          id: string
          interests: string[]
          notes: string | null
          party_size: number | null
          phone: string | null
          status: string
          travel_dates: string | null
        }
        Insert: {
          budget_usd?: string | null
          created_at?: string
          destinations?: string | null
          email: string
          full_name: string
          id?: string
          interests?: string[]
          notes?: string | null
          party_size?: number | null
          phone?: string | null
          status?: string
          travel_dates?: string | null
        }
        Update: {
          budget_usd?: string | null
          created_at?: string
          destinations?: string | null
          email?: string
          full_name?: string
          id?: string
          interests?: string[]
          notes?: string | null
          party_size?: number | null
          phone?: string | null
          status?: string
          travel_dates?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          id: string
          image: string | null
          location: string | null
          name: string
          published: boolean
          quote: string
          rating: number
          sort_order: number
          trip_taken: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image?: string | null
          location?: string | null
          name: string
          published?: boolean
          quote: string
          rating?: number
          sort_order?: number
          trip_taken?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image?: string | null
          location?: string | null
          name?: string
          published?: boolean
          quote?: string
          rating?: number
          sort_order?: number
          trip_taken?: string | null
          updated_at?: string
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
      visitor_counter: {
        Row: {
          id: string
          total_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          total_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          total_count?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_visitor_counter: { Args: never; Returns: undefined }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "customer"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      faq_category: "planning" | "conservation" | "logistics"
      payment_status: "unpaid" | "deposit_paid" | "paid_in_full" | "refunded"
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
      app_role: ["admin", "editor", "customer"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      faq_category: ["planning", "conservation", "logistics"],
      payment_status: ["unpaid", "deposit_paid", "paid_in_full", "refunded"],
    },
  },
} as const
