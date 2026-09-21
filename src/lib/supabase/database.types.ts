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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          file_path: string
          id: string
          lease_id: string | null
          merchant_id: string
          name: string
          period_end: string | null
          period_start: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type?: string
          file_path: string
          id?: string
          lease_id?: string | null
          merchant_id: string
          name: string
          period_end?: string | null
          period_start?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_path?: string
          id?: string
          lease_id?: string | null
          merchant_id?: string
          name?: string
          period_end?: string | null
          period_start?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean
          created_at: string
          department: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          bg_image_path: string | null
          created_at: string
          id: string
          label: string
          label_i18n: Json | null
          map_height: number | null
          map_width: number | null
          reference_pdf_url: string | null
          sort_order: number
        }
        Insert: {
          bg_image_path?: string | null
          created_at?: string
          id?: string
          label: string
          label_i18n?: Json | null
          map_height?: number | null
          map_width?: number | null
          reference_pdf_url?: string | null
          sort_order?: number
        }
        Update: {
          bg_image_path?: string | null
          created_at?: string
          id?: string
          label?: string
          label_i18n?: Json | null
          map_height?: number | null
          map_width?: number | null
          reference_pdf_url?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          amount: number
          id: string
          invoice_id: string
          label: string
          sort_order: number
        }
        Insert: {
          amount: number
          id?: string
          invoice_id: string
          label: string
          sort_order?: number
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_templates: {
        Row: {
          code: string
          default_amount: number | null
          id: string
          is_deduction: boolean
          label: string
          label_i18n: Json | null
          sort_order: number
        }
        Insert: {
          code: string
          default_amount?: number | null
          id?: string
          is_deduction?: boolean
          label: string
          label_i18n?: Json | null
          sort_order?: number
        }
        Update: {
          code?: string
          default_amount?: number | null
          id?: string
          is_deduction?: boolean
          label?: string
          label_i18n?: Json | null
          sort_order?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          due_date: string
          id: string
          lease_id: string
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          lease_id: string
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          lease_id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          billing_status: string
          cooperation_contract_no: string | null
          created_at: string
          deposit: number | null
          end_date: string | null
          id: string
          is_locked: boolean
          merchant_id: string
          rent_amount: number | null
          service_contract_no: string | null
          service_fee: number | null
          start_date: string
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          billing_status?: string
          cooperation_contract_no?: string | null
          created_at?: string
          deposit?: number | null
          end_date?: string | null
          id?: string
          is_locked?: boolean
          merchant_id: string
          rent_amount?: number | null
          service_contract_no?: string | null
          service_fee?: number | null
          start_date: string
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          billing_status?: string
          cooperation_contract_no?: string | null
          created_at?: string
          deposit?: number | null
          end_date?: string | null
          id?: string
          is_locked?: boolean
          merchant_id?: string
          rent_amount?: number | null
          service_contract_no?: string | null
          service_fee?: number | null
          start_date?: string
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      leasing_leads: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          converted_merchant_id: string | null
          created_at: string
          created_by: string | null
          id: string
          interested_unit_ids: string[] | null
          notes: string | null
          prospect_name: string
          stage: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          converted_merchant_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          interested_unit_ids?: string[] | null
          notes?: string | null
          prospect_name: string
          stage?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          converted_merchant_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          interested_unit_ids?: string[] | null
          notes?: string | null
          prospect_name?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leasing_leads_converted_merchant_id_fkey"
            columns: ["converted_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leasing_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          cr_number: string | null
          created_at: string
          id: string
          logo_path: string | null
          name: string
          notes: string | null
          type: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cr_number?: string | null
          created_at?: string
          id?: string
          logo_path?: string | null
          name: string
          notes?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cr_number?: string | null
          created_at?: string
          id?: string
          logo_path?: string | null
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          event: string
          id: string
          offset_days: number
          template: string
          template_i18n: Json | null
        }
        Insert: {
          event: string
          id?: string
          offset_days: number
          template: string
          template_i18n?: Json | null
        }
        Update: {
          event?: string
          id?: string
          offset_days?: number
          template?: string
          template_i18n?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          channel: string
          id: string
          read_at: string | null
          recipient_id: string
          related_ticket_id: string | null
          sent_at: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          channel: string
          id?: string
          read_at?: string | null
          recipient_id: string
          related_ticket_id?: string | null
          sent_at?: string
          title: string
          type: string
        }
        Update: {
          body?: string | null
          channel?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          related_ticket_id?: string | null
          sent_at?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          id: string
          invoice_id: string
          method: string | null
          paid_at: string
          recorded_by: string | null
        }
        Insert: {
          amount: number
          id?: string
          invoice_id: string
          method?: string | null
          paid_at?: string
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string
          method?: string | null
          paid_at?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      price_standards: {
        Row: {
          category: string | null
          created_at: string
          id: string
          notes: string | null
          unit_price: number
          updated_at: string
          zone_code: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          unit_price: number
          updated_at?: string
          zone_code?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          unit_price?: number
          updated_at?: string
          zone_code?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string
          merchant_id: string | null
          role: string
          status: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          merchant_id?: string | null
          role: string
          status?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          merchant_id?: string | null
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          created_at: string
          created_by: string | null
          department: string
          description: string | null
          id: string
          merchant_id: string | null
          resolved_at: string | null
          status: string
          type: string
          unit_id: string | null
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          department: string
          description?: string | null
          id?: string
          merchant_id?: string | null
          resolved_at?: string | null
          status?: string
          type: string
          unit_id?: string | null
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          description?: string | null
          id?: string
          merchant_id?: string | null
          resolved_at?: string | null
          status?: string
          type?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_geometries: {
        Row: {
          created_at: string
          floor_id: string
          id: string
          map_height: number
          map_width: number
          shape: Json
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          floor_id: string
          id?: string
          map_height: number
          map_width: number
          shape: Json
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          floor_id?: string
          id?: string
          map_height?: number
          map_width?: number
          shape?: Json
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_geometries_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_geometries_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area_sqm: number | null
          category: string | null
          code: string
          created_at: string
          grid_order: number
          id: string
          property_status: string
          slug: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          area_sqm?: number | null
          category?: string | null
          code: string
          created_at?: string
          grid_order?: number
          id?: string
          property_status?: string
          slug: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          area_sqm?: number | null
          category?: string | null
          code?: string
          created_at?: string
          grid_order?: number
          id?: string
          property_status?: string
          slug?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          code: string
          created_at: string
          floor_id: string
          id: string
          label: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          floor_id: string
          id?: string
          label?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          floor_id?: string
          id?: string
          label?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "zones_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_merchant_id: { Args: never; Returns: string }
      current_role: { Args: never; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
