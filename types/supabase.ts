export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_sessions: {
        Row: {
          id: string;
          profile: string;
          file_name: string;
          file_size: number;
          created_at: string;
          status: string;
          original_file_data: Json;
          parsed_rows: Json;
        };
        Insert: {
          id?: string;
          profile: string;
          file_name: string;
          file_size: number;
          created_at?: string;
          status?: string;
          original_file_data: Json;
          parsed_rows?: Json;
        };
        Update: {
          id?: string;
          profile?: string;
          file_name?: string;
          file_size?: number;
          created_at?: string;
          status?: string;
          original_file_data?: Json;
          parsed_rows?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_sessions_profile_fkey';
            columns: ['profile'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      booth_sales: {
        Row: {
          cookies_sold: Json | null;
          created_at: string;
          expected_sales: number | null;
          id: number;
          inventory_type: string;
          location: string;
          notes: string | null;
          predicted_cookies: Json | null;
          profile: string;
          sale_date: string;
          sale_time: string | null;
          scouts_attending: Json | null;
          season: number;
          status: string | null;
        };
        Insert: {
          cookies_sold?: Json | null;
          created_at?: string;
          expected_sales?: number | null;
          id?: number;
          inventory_type: string;
          location: string;
          notes?: string | null;
          predicted_cookies?: Json | null;
          profile: string;
          sale_date: string;
          sale_time?: string | null;
          scouts_attending?: Json | null;
          season?: number;
          status?: string | null;
        };
        Update: {
          cookies_sold?: Json | null;
          created_at?: string;
          expected_sales?: number | null;
          id?: number;
          inventory_type?: string;
          location?: string;
          notes?: string | null;
          predicted_cookies?: Json | null;
          profile?: string;
          sale_date?: string;
          sale_time?: string | null;
          scouts_attending?: Json | null;
          season?: number;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'booth_sales_profile_fkey';
            columns: ['profile'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booth_sales_season_fkey';
            columns: ['season'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      cookies: {
        Row: {
          abbreviation: string;
          color: string | null;
          created_at: string;
          id: number;
          is_virtual: boolean | null;
          name: string;
          order: number | null;
          overbooking_allowed: boolean | null;
          percent_of_sale: number | null;
          price: number | null;
          profile: string | null;
          season: number;
        };
        Insert: {
          abbreviation: string;
          color?: string | null;
          created_at?: string;
          id?: number;
          is_virtual?: boolean | null;
          name: string;
          order?: number | null;
          overbooking_allowed?: boolean | null;
          percent_of_sale?: number | null;
          price?: number | null;
          profile?: string | null;
          season?: number;
        };
        Update: {
          abbreviation?: string;
          color?: string | null;
          created_at?: string;
          id?: number;
          is_virtual?: boolean | null;
          name?: string;
          order?: number | null;
          overbooking_allowed?: boolean | null;
          percent_of_sale?: number | null;
          price?: string | null;
          profile?: string | null;
          season?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'cookies_profile_fkey';
            columns: ['profile'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cookies_season_fkey';
            columns: ['season'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      deposits: {
        Row: {
          amount: number;
          created_at: string;
          deposit_date: string;
          deposited_by: string | null;
          id: number;
          notes: string | null;
          profile: string | null;
          season: number;
        };
        Insert: {
          amount: number;
          created_at?: string;
          deposit_date: string;
          deposited_by?: string | null;
          id?: number;
          notes?: string | null;
          profile?: string | null;
          season?: number;
        };
        Update: {
          amount?: number;
          created_at?: string;
          deposit_date?: string;
          deposited_by?: string | null;
          id?: number;
          notes?: string | null;
          profile?: string | null;
          season?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'deposits_profile_fkey';
            columns: ['profile'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deposits_season_fkey';
            columns: ['season'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_checks: {
        Row: {
          check_date: string;
          conducted_by: string | null;
          created_at: string;
          discrepancies: Json;
          expected_inventory: Json;
          id: number;
          notes: string | null;
          physical_inventory: Json;
          profile: string;
          season: number;
          status: string;
          total_discrepancies: number;
        };
        Insert: {
          check_date?: string;
          conducted_by?: string | null;
          created_at?: string;
          discrepancies: Json;
          expected_inventory: Json;
          id?: number;
          notes?: string | null;
          physical_inventory: Json;
          profile: string;
          season?: number;
          status?: string;
          total_discrepancies?: number;
        };
        Update: {
          check_date?: string;
          conducted_by?: string | null;
          created_at?: string;
          discrepancies?: Json;
          expected_inventory?: Json;
          id?: number;
          notes?: string | null;
          physical_inventory?: Json;
          profile?: string;
          season?: number;
          status?: string;
          total_discrepancies?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_checks_profile_fkey';
            columns: ['profile'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_checks_season_fkey';
            columns: ['season'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          cookies: Json | null;
          created_at: string;
          from: number | null;
          id: number;
          notes: string | null;
          order_date: string | null;
          order_num: string | null;
          processed_date: string | null;
          profile: string | null;
          season: number;
          status: string | null;
          supplier: string | null;
          to: number | null;
          type: string | null;
        };
        Insert: {
          cookies?: Json | null;
          created_at?: string;
          from?: number | null;
          id?: number;
          notes?: string | null;
          order_date?: string | null;
          order_num?: string | null;
          processed_date?: string | null;
          profile?: string | null;
          season?: number;
          status?: string | null;
          supplier?: string | null;
          to?: number | null;
          type?: string | null;
        };
        Update: {
          cookies?: Json | null;
          created_at?: string;
          from?: number | null;
          id?: number;
          notes?: string | null;
          order_date?: string | null;
          order_num?: string | null;
          processed_date?: string | null;
          profile?: string | null;
          season?: number;
          status?: string | null;
          supplier?: string | null;
          to?: number | null;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_profile_fkey';
            columns: ['profile'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_season_fkey';
            columns: ['season'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_to_fkey';
            columns: ['to'];
            isOneToOne: false;
            referencedRelation: 'sellers';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          id: number;
          notes: string | null;
          payment_date: string;
          profile: string | null;
          season: number;
          seller_id: number;
          type: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: number;
          notes?: string | null;
          payment_date: string;
          profile?: string | null;
          season?: number;
          seller_id: number;
          type?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: number;
          notes?: string | null;
          payment_date?: string;
          profile?: string | null;
          season?: number;
          seller_id?: number;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_profile_fkey';
            columns: ['profile'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_season_fkey';
            columns: ['season'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_seller_id_fkey';
            columns: ['seller_id'];
            isOneToOne: false;
            referencedRelation: 'sellers';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          display_name: string | null;
          id: string;
          season: number | null;
          state: Json | null;
          updated_at: string | null;
        };
        Insert: {
          display_name?: string | null;
          id: string;
          season?: number | null;
          state?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          display_name?: string | null;
          id?: string;
          season?: number | null;
          state?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      season_collaborators: {
        Row: {
          can_edit_booths: boolean;
          can_edit_inventory_checks: boolean;
          can_view_booths: boolean;
          can_view_inventory_checks: boolean;
          created_at: string;
          id: number;
          invited_by: string;
          profile_id: string;
          season_id: number;
        };
        Insert: {
          can_edit_booths?: boolean;
          can_edit_inventory_checks?: boolean;
          can_view_booths?: boolean;
          can_view_inventory_checks?: boolean;
          created_at?: string;
          id?: number;
          invited_by: string;
          profile_id: string;
          season_id: number;
        };
        Update: {
          can_edit_booths?: boolean;
          can_edit_inventory_checks?: boolean;
          can_view_booths?: boolean;
          can_view_inventory_checks?: boolean;
          created_at?: string;
          id?: number;
          invited_by?: string;
          profile_id?: string;
          season_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'season_collaborators_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'season_collaborators_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'season_collaborators_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      seasons: {
        Row: {
          created_at: string;
          id: number;
          profile: string;
          publish_girl_request_form: boolean | null;
          troop_number: string;
          year: number;
        };
        Insert: {
          created_at?: string;
          id?: number;
          profile: string;
          publish_girl_request_form?: boolean | null;
          troop_number?: string;
          year?: number;
        };
        Update: {
          created_at?: string;
          id?: number;
          profile?: string;
          publish_girl_request_form?: boolean | null;
          troop_number?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'seasons_profile_fkey';
            columns: ['profile'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      sellers: {
        Row: {
          created_at: string;
          first_name: string;
          id: number;
          last_name: string;
          preferred_name: string | null;
          profile: string | null;
          season: number;
        };
        Insert: {
          created_at?: string;
          first_name: string;
          id?: number;
          last_name: string;
          preferred_name?: string | null;
          profile?: string | null;
          season?: number;
        };
        Update: {
          created_at?: string;
          first_name?: string;
          id?: number;
          last_name?: string;
          preferred_name?: string | null;
          profile?: string | null;
          season?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'sellers_profile_fkey';
            columns: ['profile'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sellers_season_fkey';
            columns: ['season'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      uploads: {
        Row: {
          created_at: string;
          data: Json | null;
          id: number;
          profile: string | null;
          season: number;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          id?: number;
          profile?: string | null;
          season?: number;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          id?: number;
          profile?: string | null;
          season?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'uploads_profile_fkey';
            columns: ['profile'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'uploads_season_fkey';
            columns: ['season'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
