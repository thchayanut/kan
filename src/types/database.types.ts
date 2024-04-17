export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      _card_labels: {
        Row: {
          cardId: number
          labelId: number
        }
        Insert: {
          cardId: number
          labelId: number
        }
        Update: {
          cardId?: number
          labelId?: number
        }
        Relationships: [
          {
            foreignKeyName: "_card_labels_cardId_card_id_fk"
            columns: ["cardId"]
            isOneToOne: false
            referencedRelation: "card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_card_labels_labelId_label_id_fk"
            columns: ["labelId"]
            isOneToOne: false
            referencedRelation: "label"
            referencedColumns: ["id"]
          },
        ]
      }
      _card_workspace_members: {
        Row: {
          cardId: number
          workspaceMemberId: number
        }
        Insert: {
          cardId: number
          workspaceMemberId: number
        }
        Update: {
          cardId?: number
          workspaceMemberId?: number
        }
        Relationships: [
          {
            foreignKeyName: "_card_workspace_members_cardId_card_id_fk"
            columns: ["cardId"]
            isOneToOne: false
            referencedRelation: "card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_card_workspace_members_workspaceMemberId_workspace_members_id_"
            columns: ["workspaceMemberId"]
            isOneToOne: false
            referencedRelation: "workspace_members"
            referencedColumns: ["id"]
          },
        ]
      }
      account: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_userId_user_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      board: {
        Row: {
          createdAt: string
          createdBy: string
          deletedAt: string | null
          deletedBy: string | null
          id: number
          importId: number | null
          name: string
          publicId: string
          updatedAt: string | null
          workspaceId: number
        }
        Insert: {
          createdAt?: string
          createdBy: string
          deletedAt?: string | null
          deletedBy?: string | null
          id?: number
          importId?: number | null
          name: string
          publicId: string
          updatedAt?: string | null
          workspaceId: number
        }
        Update: {
          createdAt?: string
          createdBy?: string
          deletedAt?: string | null
          deletedBy?: string | null
          id?: number
          importId?: number | null
          name?: string
          publicId?: string
          updatedAt?: string | null
          workspaceId?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_createdBy_user_id_fk"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_deletedBy_user_id_fk"
            columns: ["deletedBy"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_importId_import_id_fk"
            columns: ["importId"]
            isOneToOne: false
            referencedRelation: "import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_workspaceId_workspace_id_fk"
            columns: ["workspaceId"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
          },
        ]
      }
      card: {
        Row: {
          createdAt: string
          createdBy: string
          deletedAt: string | null
          deletedBy: string | null
          description: string | null
          id: number
          importId: number | null
          index: number
          listId: number
          publicId: string
          title: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string
          createdBy: string
          deletedAt?: string | null
          deletedBy?: string | null
          description?: string | null
          id?: number
          importId?: number | null
          index: number
          listId: number
          publicId: string
          title: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string
          createdBy?: string
          deletedAt?: string | null
          deletedBy?: string | null
          description?: string | null
          id?: number
          importId?: number | null
          index?: number
          listId?: number
          publicId?: string
          title?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_createdBy_user_id_fk"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_deletedBy_user_id_fk"
            columns: ["deletedBy"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_importId_import_id_fk"
            columns: ["importId"]
            isOneToOne: false
            referencedRelation: "import"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_listId_list_id_fk"
            columns: ["listId"]
            isOneToOne: false
            referencedRelation: "list"
            referencedColumns: ["id"]
          },
        ]
      }
      import: {
        Row: {
          createdAt: string
          createdBy: string
          id: number
          publicId: string
          source: Database["public"]["Enums"]["source"]
          status: Database["public"]["Enums"]["status"]
        }
        Insert: {
          createdAt?: string
          createdBy: string
          id?: number
          publicId: string
          source: Database["public"]["Enums"]["source"]
          status: Database["public"]["Enums"]["status"]
        }
        Update: {
          createdAt?: string
          createdBy?: string
          id?: number
          publicId?: string
          source?: Database["public"]["Enums"]["source"]
          status?: Database["public"]["Enums"]["status"]
        }
        Relationships: [
          {
            foreignKeyName: "import_createdBy_user_id_fk"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      label: {
        Row: {
          boardId: number
          colourCode: string | null
          createdAt: string
          createdBy: string
          id: number
          importId: number | null
          name: string
          publicId: string
          updatedAt: string | null
        }
        Insert: {
          boardId: number
          colourCode?: string | null
          createdAt?: string
          createdBy: string
          id?: number
          importId?: number | null
          name: string
          publicId: string
          updatedAt?: string | null
        }
        Update: {
          boardId?: number
          colourCode?: string | null
          createdAt?: string
          createdBy?: string
          id?: number
          importId?: number | null
          name?: string
          publicId?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "label_boardId_board_id_fk"
            columns: ["boardId"]
            isOneToOne: false
            referencedRelation: "board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_createdBy_user_id_fk"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_importId_import_id_fk"
            columns: ["importId"]
            isOneToOne: false
            referencedRelation: "import"
            referencedColumns: ["id"]
          },
        ]
      }
      list: {
        Row: {
          boardId: number
          createdAt: string
          createdBy: string
          deletedAt: string | null
          deletedBy: string | null
          id: number
          importId: number | null
          index: number
          name: string
          publicId: string
          updatedAt: string | null
        }
        Insert: {
          boardId: number
          createdAt?: string
          createdBy: string
          deletedAt?: string | null
          deletedBy?: string | null
          id?: number
          importId?: number | null
          index: number
          name: string
          publicId: string
          updatedAt?: string | null
        }
        Update: {
          boardId?: number
          createdAt?: string
          createdBy?: string
          deletedAt?: string | null
          deletedBy?: string | null
          id?: number
          importId?: number | null
          index?: number
          name?: string
          publicId?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_boardId_board_id_fk"
            columns: ["boardId"]
            isOneToOne: false
            referencedRelation: "board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_createdBy_user_id_fk"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_deletedBy_user_id_fk"
            columns: ["deletedBy"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_importId_import_id_fk"
            columns: ["importId"]
            isOneToOne: false
            referencedRelation: "import"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          expires: string
          sessionToken: string
          userId: string
        }
        Insert: {
          expires: string
          sessionToken: string
          userId: string
        }
        Update: {
          expires?: string
          sessionToken?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_userId_user_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          email: string
          emailVerified: string | null
          id: string
          image: string | null
          name: string | null
        }
        Insert: {
          email: string
          emailVerified?: string | null
          id: string
          image?: string | null
          name?: string | null
        }
        Update: {
          email?: string
          emailVerified?: string | null
          id?: string
          image?: string | null
          name?: string | null
        }
        Relationships: []
      }
      verificationToken: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
      workspace: {
        Row: {
          createdAt: string
          createdBy: string
          deletedAt: string | null
          deletedBy: string | null
          id: number
          name: string
          publicId: string
          slug: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string
          createdBy: string
          deletedAt?: string | null
          deletedBy?: string | null
          id?: number
          name: string
          publicId: string
          slug: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string
          createdBy?: string
          deletedAt?: string | null
          deletedBy?: string | null
          id?: number
          name?: string
          publicId?: string
          slug?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_createdBy_user_id_fk"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_deletedBy_user_id_fk"
            columns: ["deletedBy"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          createdAt: string
          createdBy: string
          deletedAt: string | null
          id: number
          publicId: string
          role: Database["public"]["Enums"]["role"]
          updatedAt: string | null
          userId: string
          workspaceId: number
        }
        Insert: {
          createdAt?: string
          createdBy: string
          deletedAt?: string | null
          id?: number
          publicId: string
          role: Database["public"]["Enums"]["role"]
          updatedAt?: string | null
          userId: string
          workspaceId: number
        }
        Update: {
          createdAt?: string
          createdBy?: string
          deletedAt?: string | null
          id?: number
          publicId?: string
          role?: Database["public"]["Enums"]["role"]
          updatedAt?: string | null
          userId?: string
          workspaceId?: number
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_userId_user_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspaceId_workspace_id_fk"
            columns: ["workspaceId"]
            isOneToOne: false
            referencedRelation: "workspace"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reorder_cards: {
        Args: {
          card_id: number
          current_list_id: number
          new_list_id: number
          current_index: number
          new_index: number
        }
        Returns: undefined
      }
      reorder_lists: {
        Args: {
          board_id: number
          list_id: number
          current_index: number
          new_index: number
        }
        Returns: undefined
      }
      shift_card_index: {
        Args: {
          list_id: number
          card_index: number
        }
        Returns: undefined
      }
      shift_list_index: {
        Args: {
          board_id: number
          list_index: number
        }
        Returns: undefined
      }
    }
    Enums: {
      role: "admin" | "member" | "guest"
      source: "trello"
      status: "started" | "success" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
