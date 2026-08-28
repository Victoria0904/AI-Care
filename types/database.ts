// Supabase Database 类型定义
// 正式版本应该用 `supabase gen types typescript` 自动生成
// 当前为手写版，覆盖 MVP 5 张表，详见 ARCHITECTURE.md §5

export type ConsultationStatus =
  | 'chief_complaint_pending'
  | 'chief_complaint_done'
  | 'transcribing'
  | 'summarizing'
  | 'completed';

export type ChatRole = 'user' | 'assistant' | 'system';

export type Speaker = 'doctor' | 'patient' | 'family' | 'unknown';

export type Medication = {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
};

export type FollowUp = {
  type?: string;
  time?: string;
  description?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          avatar_url: string | null;
          role: 'patient' | 'family' | null;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          avatar_url?: string | null;
          role?: 'patient' | 'family' | null;
          created_at?: string;
        };
        Update: {
          nickname?: string | null;
          avatar_url?: string | null;
          role?: 'patient' | 'family' | null;
        };
        Relationships: [];
      };
      consultations: {
        Row: {
          id: string;
          patient_id: string;
          status: ConsultationStatus;
          chief_complaint_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          status?: ConsultationStatus;
          chief_complaint_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: ConsultationStatus;
          chief_complaint_text?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      chief_complaint_chats: {
        Row: {
          id: string;
          consultation_id: string;
          role: ChatRole;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          consultation_id: string;
          role: ChatRole;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [];
      };
      transcripts: {
        Row: {
          id: string;
          consultation_id: string;
          sequence_no: number;
          content: string;
          is_final: boolean;
          speaker: Speaker | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          consultation_id: string;
          sequence_no: number;
          content: string;
          is_final?: boolean;
          speaker?: Speaker | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          is_final?: boolean;
        };
        Relationships: [];
      };
      consultation_summaries: {
        Row: {
          id: string;
          consultation_id: string;
          diagnosis: string | null;
          doctor_advice: string | null;
          medications: Medication[];
          follow_ups: FollowUp[];
          warnings: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          consultation_id: string;
          diagnosis?: string | null;
          doctor_advice?: string | null;
          medications?: Medication[];
          follow_ups?: FollowUp[];
          warnings?: string[];
          created_at?: string;
        };
        Update: {
          diagnosis?: string | null;
          doctor_advice?: string | null;
          medications?: Medication[];
          follow_ups?: FollowUp[];
          warnings?: string[];
        };
        Relationships: [];
      };
    };
    Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, Record<string, unknown>>;
  };
};
