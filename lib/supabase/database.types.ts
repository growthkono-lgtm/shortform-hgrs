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
      adfilm: {
        Row: {
          assignee_id: string | null
          brief: Json
          cost_usd: number | null
          created_at: string
          deliverable_id: string | null
          final_url: string | null
          format: string
          id: string
          last_error: string | null
          project_id: string | null
          seconds: number | null
          shots: Json
          stage: string
          storyboard: Json
          title: string | null
          updated_at: string
          video_id: string | null
        }
        Insert: {
          assignee_id?: string | null
          brief?: Json
          cost_usd?: number | null
          created_at?: string
          deliverable_id?: string | null
          final_url?: string | null
          format?: string
          id?: string
          last_error?: string | null
          project_id?: string | null
          seconds?: number | null
          shots?: Json
          stage?: string
          storyboard?: Json
          title?: string | null
          updated_at?: string
          video_id?: string | null
        }
        Update: {
          assignee_id?: string | null
          brief?: Json
          cost_usd?: number | null
          created_at?: string
          deliverable_id?: string | null
          final_url?: string | null
          format?: string
          id?: string
          last_error?: string | null
          project_id?: string | null
          seconds?: number | null
          shots?: Json
          stage?: string
          storyboard?: Json
          title?: string | null
          updated_at?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adfilm_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adfilm_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adfilm_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
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
      blog_job: {
        Row: {
          attempts: number
          audit: Json | null
          cost_usd: number | null
          created_at: string
          format: string
          id: string
          keyword_term: string | null
          last_error: string | null
          locked_at: string | null
          pillar: string
          plan: Json | null
          post_id: string | null
          research: string | null
          revisions: number
          scheduled_for: string
          search_count: number | null
          segment: string | null
          sources: Json | null
          stage: string
          topic: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          audit?: Json | null
          cost_usd?: number | null
          created_at?: string
          format: string
          id?: string
          keyword_term?: string | null
          last_error?: string | null
          locked_at?: string | null
          pillar: string
          plan?: Json | null
          post_id?: string | null
          research?: string | null
          revisions?: number
          scheduled_for: string
          search_count?: number | null
          segment?: string | null
          sources?: Json | null
          stage?: string
          topic: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          audit?: Json | null
          cost_usd?: number | null
          created_at?: string
          format?: string
          id?: string
          keyword_term?: string | null
          last_error?: string | null
          locked_at?: string | null
          pillar?: string
          plan?: Json | null
          post_id?: string | null
          research?: string | null
          revisions?: number
          scheduled_for?: string
          search_count?: number | null
          segment?: string | null
          sources?: Json | null
          stage?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_job_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_post"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_keyword: {
        Row: {
          ad_depth: number | null
          buyer_intent: boolean
          competition: string | null
          created_at: string
          difficulty: string | null
          id: string
          mobile_clicks: number | null
          mobile_ctr: number | null
          mobile_volume: number | null
          niche_score: number | null
          note: string | null
          pc_clicks: number | null
          pc_ctr: number | null
          pc_volume: number | null
          pillar: string
          refreshed_at: string | null
          source: string
          status: string
          term: string
          tier: string
          total_volume: number | null
          volume: number | null
        }
        Insert: {
          ad_depth?: number | null
          buyer_intent?: boolean
          competition?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          mobile_clicks?: number | null
          mobile_ctr?: number | null
          mobile_volume?: number | null
          niche_score?: number | null
          note?: string | null
          pc_clicks?: number | null
          pc_ctr?: number | null
          pc_volume?: number | null
          pillar: string
          refreshed_at?: string | null
          source?: string
          status?: string
          term: string
          tier?: string
          total_volume?: number | null
          volume?: number | null
        }
        Update: {
          ad_depth?: number | null
          buyer_intent?: boolean
          competition?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          mobile_clicks?: number | null
          mobile_ctr?: number | null
          mobile_volume?: number | null
          niche_score?: number | null
          note?: string | null
          pc_clicks?: number | null
          pc_ctr?: number | null
          pc_volume?: number | null
          pillar?: string
          refreshed_at?: string | null
          source?: string
          status?: string
          term?: string
          tier?: string
          total_volume?: number | null
          volume?: number | null
        }
        Relationships: []
      }
      blog_keyword_metric: {
        Row: {
          collected_at: string
          competition: string | null
          id: string
          keyword_id: string
          mobile_ctr: number | null
          mobile_volume: number | null
          pc_ctr: number | null
          pc_volume: number | null
          total_volume: number | null
          week: string
        }
        Insert: {
          collected_at?: string
          competition?: string | null
          id?: string
          keyword_id: string
          mobile_ctr?: number | null
          mobile_volume?: number | null
          pc_ctr?: number | null
          pc_volume?: number | null
          total_volume?: number | null
          week: string
        }
        Update: {
          collected_at?: string
          competition?: string | null
          id?: string
          keyword_id?: string
          mobile_ctr?: number | null
          mobile_volume?: number | null
          pc_ctr?: number | null
          pc_volume?: number | null
          total_volume?: number | null
          week?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_keyword_metric_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "blog_keyword"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_notice_log: {
        Row: {
          post_id: string
          recipients: number
          sent_at: string
        }
        Insert: {
          post_id: string
          recipients?: number
          sent_at?: string
        }
        Update: {
          post_id?: string
          recipients?: number
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_notice_log_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "blog_post"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_ops_log: {
        Row: {
          at: string
          id: string
          note: string | null
          ok: boolean
          route: string
        }
        Insert: {
          at?: string
          id?: string
          note?: string | null
          ok: boolean
          route: string
        }
        Update: {
          at?: string
          id?: string
          note?: string | null
          ok?: boolean
          route?: string
        }
        Relationships: []
      }
      blog_post: {
        Row: {
          approved_at: string | null
          audit: Json | null
          body: string | null
          chars: number | null
          client_industry: string | null
          client_name: string | null
          client_period: string | null
          created_at: string
          format: string
          id: string
          keyword_id: string | null
          kind: string
          notified_at: string | null
          pillar: string
          plan: Json
          published_at: string | null
          read_minutes: number | null
          reject_note: string | null
          scheduled_for: string | null
          seq: number | null
          slug: string
          sources: Json
          status: string
          sub_keyword_ids: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          audit?: Json | null
          body?: string | null
          chars?: number | null
          client_industry?: string | null
          client_name?: string | null
          client_period?: string | null
          created_at?: string
          format: string
          id?: string
          keyword_id?: string | null
          kind?: string
          notified_at?: string | null
          pillar: string
          plan: Json
          published_at?: string | null
          read_minutes?: number | null
          reject_note?: string | null
          scheduled_for?: string | null
          seq?: number | null
          slug: string
          sources?: Json
          status?: string
          sub_keyword_ids?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          audit?: Json | null
          body?: string | null
          chars?: number | null
          client_industry?: string | null
          client_name?: string | null
          client_period?: string | null
          created_at?: string
          format?: string
          id?: string
          keyword_id?: string | null
          kind?: string
          notified_at?: string | null
          pillar?: string
          plan?: Json
          published_at?: string | null
          read_minutes?: number | null
          reject_note?: string | null
          scheduled_for?: string | null
          seq?: number | null
          slug?: string
          sources?: Json
          status?: string
          sub_keyword_ids?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "blog_keyword"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_metric: {
        Row: {
          captured_on: string
          clicks: number
          impressions: number
          offset_days: number
          position: number | null
          post_id: string
        }
        Insert: {
          captured_on: string
          clicks?: number
          impressions?: number
          offset_days: number
          position?: number | null
          post_id: string
        }
        Update: {
          captured_on?: string
          clicks?: number
          impressions?: number
          offset_days?: number
          position?: number | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_metric_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_post"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_week: {
        Row: {
          assists: number
          captured_at: string
          clicks: number
          impressions: number
          inquiries: number
          last_touch: number
          position: number | null
          post_id: string
          views: number
          week_start: string
        }
        Insert: {
          assists?: number
          captured_at?: string
          clicks?: number
          impressions?: number
          inquiries?: number
          last_touch?: number
          position?: number | null
          post_id: string
          views?: number
          week_start: string
        }
        Update: {
          assists?: number
          captured_at?: string
          clicks?: number
          impressions?: number
          inquiries?: number
          last_touch?: number
          position?: number | null
          post_id?: string
          views?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_week_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_post"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_remind_log: {
        Row: {
          day: string
          sent_at: string
        }
        Insert: {
          day: string
          sent_at?: string
        }
        Update: {
          day?: string
          sent_at?: string
        }
        Relationships: []
      }
      blog_report_log: {
        Row: {
          day: string
          sent_at: string
          summary: string | null
        }
        Insert: {
          day: string
          sent_at?: string
          summary?: string | null
        }
        Update: {
          day?: string
          sent_at?: string
          summary?: string | null
        }
        Relationships: []
      }
      blog_search_daily: {
        Row: {
          captured_on: string
          clicks: number
          created_at: string
          dimension: string
          id: number
          impressions: number
          key: string
          position: number | null
        }
        Insert: {
          captured_on: string
          clicks?: number
          created_at?: string
          dimension: string
          id?: never
          impressions?: number
          key?: string
          position?: number | null
        }
        Update: {
          captured_on?: string
          clicks?: number
          created_at?: string
          dimension?: string
          id?: never
          impressions?: number
          key?: string
          position?: number | null
        }
        Relationships: []
      }
      blog_subscriber: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      blog_trend: {
        Row: {
          angle: string
          captured_on: string
          combined_term: string
          created_at: string
          headline: string
          id: string
          pillar: string
          source_name: string | null
          source_url: string
          used_on: string | null
        }
        Insert: {
          angle: string
          captured_on: string
          combined_term: string
          created_at?: string
          headline: string
          id?: string
          pillar: string
          source_name?: string | null
          source_url: string
          used_on?: string | null
        }
        Update: {
          angle?: string
          captured_on?: string
          combined_term?: string
          created_at?: string
          headline?: string
          id?: string
          pillar?: string
          source_name?: string | null
          source_url?: string
          used_on?: string | null
        }
        Relationships: []
      }
      blog_view: {
        Row: {
          day: string
          slug: string
          views: number
        }
        Insert: {
          day: string
          slug: string
          views?: number
        }
        Update: {
          day?: string
          slug?: string
          views?: number
        }
        Relationships: []
      }
      blog_visit: {
        Row: {
          first_seen: string
          landing: boolean
          slug: string
          visitor_id: string
        }
        Insert: {
          first_seen?: string
          landing?: boolean
          slug: string
          visitor_id: string
        }
        Update: {
          first_seen?: string
          landing?: boolean
          slug?: string
          visitor_id?: string
        }
        Relationships: []
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
          assignee_id: string | null
          created_at: string
          drive_file_id: string | null
          due_date: string | null
          final_drive_file_id: string | null
          final_drive_link: string | null
          id: string
          plan_note: string | null
          preview_path: string | null
          preview_url: string | null
          project_id: string
          remind_24h_at: string | null
          remind_48h_at: string | null
          revision_round: number
          seq: number
          status: string
          title: string | null
          updated_at: string
          work_file_name: string | null
          work_status: string
          work_url: string | null
          worker_updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          drive_file_id?: string | null
          due_date?: string | null
          final_drive_file_id?: string | null
          final_drive_link?: string | null
          id?: string
          plan_note?: string | null
          preview_path?: string | null
          preview_url?: string | null
          project_id: string
          remind_24h_at?: string | null
          remind_48h_at?: string | null
          revision_round?: number
          seq: number
          status?: string
          title?: string | null
          updated_at?: string
          work_file_name?: string | null
          work_status?: string
          work_url?: string | null
          worker_updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          drive_file_id?: string | null
          due_date?: string | null
          final_drive_file_id?: string | null
          final_drive_link?: string | null
          id?: string
          plan_note?: string | null
          preview_path?: string | null
          preview_url?: string | null
          project_id?: string
          remind_24h_at?: string | null
          remind_48h_at?: string | null
          revision_round?: number
          seq?: number
          status?: string
          title?: string | null
          updated_at?: string
          work_file_name?: string | null
          work_status?: string
          work_url?: string | null
          worker_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          expires_at: string | null
          granted_at: string
          id: string
          kind: string
          label: string | null
          project_id: string
          revoked: boolean
        }
        Insert: {
          drive_folder_id: string
          drive_link: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          kind?: string
          label?: string | null
          project_id: string
          revoked?: boolean
        }
        Update: {
          drive_folder_id?: string
          drive_link?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          kind?: string
          label?: string | null
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
      email_log: {
        Row: {
          created_at: string
          delivery: string | null
          delivery_checked_at: string | null
          error: string | null
          id: string
          inquiry_id: string | null
          kind: string
          project_id: string | null
          provider_id: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          created_at?: string
          delivery?: string | null
          delivery_checked_at?: string | null
          error?: string | null
          id?: string
          inquiry_id?: string | null
          kind: string
          project_id?: string | null
          provider_id?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          created_at?: string
          delivery?: string | null
          delivery_checked_at?: string | null
          error?: string | null
          id?: string
          inquiry_id?: string | null
          kind?: string
          project_id?: string | null
          provider_id?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_candidates: {
        Row: {
          avg_comments: number | null
          avg_cpv: number | null
          avg_likes: number | null
          avg_views: number | null
          bio: string | null
          category: string | null
          channel_name: string
          channel_url: string
          confirmed: boolean
          content_count: number | null
          created_at: string
          fetch_error: string | null
          fetched_at: string | null
          follower_count: number | null
          id: string
          latest_posts: Json
          note: string | null
          platform: string
          project_id: string
          reward: number | null
          selected: boolean
          selected_at: string | null
          snapshot_at: string
          sort_order: number
          thumbnail_url: string | null
        }
        Insert: {
          avg_comments?: number | null
          avg_cpv?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          bio?: string | null
          category?: string | null
          channel_name: string
          channel_url: string
          confirmed?: boolean
          content_count?: number | null
          created_at?: string
          fetch_error?: string | null
          fetched_at?: string | null
          follower_count?: number | null
          id?: string
          latest_posts?: Json
          note?: string | null
          platform?: string
          project_id: string
          reward?: number | null
          selected?: boolean
          selected_at?: string | null
          snapshot_at?: string
          sort_order?: number
          thumbnail_url?: string | null
        }
        Update: {
          avg_comments?: number | null
          avg_cpv?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          bio?: string | null
          category?: string | null
          channel_name?: string
          channel_url?: string
          confirmed?: boolean
          content_count?: number | null
          created_at?: string
          fetch_error?: string | null
          fetched_at?: string | null
          follower_count?: number | null
          id?: string
          latest_posts?: Json
          note?: string | null
          platform?: string
          project_id?: string
          reward?: number | null
          selected?: boolean
          selected_at?: string | null
          snapshot_at?: string
          sort_order?: number
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_candidates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_contents: {
        Row: {
          candidate_id: string | null
          caption: string | null
          collected_at: string
          comment_count: number | null
          created_at: string
          handle: string
          id: string
          like_count: number | null
          permalink: string
          posted_at: string | null
          project_id: string
          review_status: string
          reviewed_at: string | null
          revision_note: string | null
          thumbnail_url: string | null
          view_count: number | null
        }
        Insert: {
          candidate_id?: string | null
          caption?: string | null
          collected_at?: string
          comment_count?: number | null
          created_at?: string
          handle: string
          id?: string
          like_count?: number | null
          permalink: string
          posted_at?: string | null
          project_id: string
          review_status?: string
          reviewed_at?: string | null
          revision_note?: string | null
          thumbnail_url?: string | null
          view_count?: number | null
        }
        Update: {
          candidate_id?: string | null
          caption?: string | null
          collected_at?: string
          comment_count?: number | null
          created_at?: string
          handle?: string
          id?: string
          like_count?: number | null
          permalink?: string
          posted_at?: string | null
          project_id?: string
          review_status?: string
          reviewed_at?: string | null
          revision_note?: string | null
          thumbnail_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_contents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "influencer_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_contents_project_id_fkey"
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
      inquiries: {
        Row: {
          applied_at: string | null
          assist_post_ids: string[] | null
          brand_url: string | null
          brochure_sent_at: string | null
          company_name: string
          consent_version: string
          contact_name: string
          contact_title: string | null
          created_at: string
          diagnosis: Json | null
          email: string
          entry_post_id: string | null
          first_at: string | null
          first_path: string | null
          first_referrer: string | null
          id: string
          interest: string
          ip_address: unknown
          last_at: string | null
          last_path: string | null
          last_referrer: string | null
          marketing_agreed: boolean
          message: string | null
          phone: string | null
          project_id: string | null
          status: string
          user_agent: string | null
          utm: Json | null
          visit_count: number | null
          visitor_id: string | null
          volume: string
        }
        Insert: {
          applied_at?: string | null
          assist_post_ids?: string[] | null
          brand_url?: string | null
          brochure_sent_at?: string | null
          company_name: string
          consent_version: string
          contact_name: string
          contact_title?: string | null
          created_at?: string
          diagnosis?: Json | null
          email: string
          entry_post_id?: string | null
          first_at?: string | null
          first_path?: string | null
          first_referrer?: string | null
          id?: string
          interest: string
          ip_address?: unknown
          last_at?: string | null
          last_path?: string | null
          last_referrer?: string | null
          marketing_agreed?: boolean
          message?: string | null
          phone?: string | null
          project_id?: string | null
          status?: string
          user_agent?: string | null
          utm?: Json | null
          visit_count?: number | null
          visitor_id?: string | null
          volume: string
        }
        Update: {
          applied_at?: string | null
          assist_post_ids?: string[] | null
          brand_url?: string | null
          brochure_sent_at?: string | null
          company_name?: string
          consent_version?: string
          contact_name?: string
          contact_title?: string | null
          created_at?: string
          diagnosis?: Json | null
          email?: string
          entry_post_id?: string | null
          first_at?: string | null
          first_path?: string | null
          first_referrer?: string | null
          id?: string
          interest?: string
          ip_address?: unknown
          last_at?: string | null
          last_path?: string | null
          last_referrer?: string | null
          marketing_agreed?: boolean
          message?: string | null
          phone?: string | null
          project_id?: string | null
          status?: string
          user_agent?: string | null
          utm?: Json | null
          visit_count?: number | null
          visitor_id?: string | null
          volume?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_entry_post_id_fkey"
            columns: ["entry_post_id"]
            isOneToOne: false
            referencedRelation: "blog_post"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_project_id_fkey"
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
      project_guidelines: {
        Row: {
          brand_intro: string | null
          extra: string | null
          forbidden: string | null
          id: string
          price_range: string | null
          project_id: string
          promotion: string | null
          reference_urls: string | null
          submitted_at: string | null
          target: string | null
          tone: string | null
          updated_at: string
          usp: string | null
        }
        Insert: {
          brand_intro?: string | null
          extra?: string | null
          forbidden?: string | null
          id?: string
          price_range?: string | null
          project_id: string
          promotion?: string | null
          reference_urls?: string | null
          submitted_at?: string | null
          target?: string | null
          tone?: string | null
          updated_at?: string
          usp?: string | null
        }
        Update: {
          brand_intro?: string | null
          extra?: string | null
          forbidden?: string | null
          id?: string
          price_range?: string | null
          project_id?: string
          promotion?: string | null
          reference_urls?: string | null
          submitted_at?: string | null
          target?: string | null
          tone?: string | null
          updated_at?: string
          usp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_guidelines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          inquiry_id: string | null
          order_id: string | null
          plan_id: string | null
          recruit_deadline: string | null
          source_delivered_at: string | null
          stage_a: string | null
          stage_b: string
          started_at: string | null
          type: string
          updated_at: string
          user_id: string
          work_alias: string | null
          work_code: string | null
        }
        Insert: {
          brand_profile_id?: string | null
          campaign_input?: Json
          created_at?: string
          guideline_ai?: Json | null
          guideline_confirmed_at?: string | null
          head_review_status?: string | null
          id?: string
          inquiry_id?: string | null
          order_id?: string | null
          plan_id?: string | null
          recruit_deadline?: string | null
          source_delivered_at?: string | null
          stage_a?: string | null
          stage_b?: string
          started_at?: string | null
          type: string
          updated_at?: string
          user_id: string
          work_alias?: string | null
          work_code?: string | null
        }
        Update: {
          brand_profile_id?: string | null
          campaign_input?: Json
          created_at?: string
          guideline_ai?: Json | null
          guideline_confirmed_at?: string | null
          head_review_status?: string | null
          id?: string
          inquiry_id?: string | null
          order_id?: string | null
          plan_id?: string | null
          recruit_deadline?: string | null
          source_delivered_at?: string | null
          stage_a?: string | null
          stage_b?: string
          started_at?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          work_alias?: string | null
          work_code?: string | null
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
            foreignKeyName: "projects_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
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
            foreignKeyName: "projects_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
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
      seeding_shipments: {
        Row: {
          address: string | null
          created_at: string
          id: string
          influencer_name: string
          note: string | null
          option: string | null
          phone: string | null
          product: string | null
          project_id: string
          quantity: string | null
          shipped_at: string | null
          sort_order: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          influencer_name: string
          note?: string | null
          option?: string | null
          phone?: string | null
          product?: string | null
          project_id: string
          quantity?: string | null
          shipped_at?: string | null
          sort_order?: number
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          influencer_name?: string
          note?: string | null
          option?: string | null
          phone?: string | null
          product?: string | null
          project_id?: string
          quantity?: string | null
          shipped_at?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "seeding_shipments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      spend_log: {
        Row: {
          at: string
          id: string
          kind: string
          meta: Json
          ref: string
          service: string
          usd: number
        }
        Insert: {
          at?: string
          id?: string
          kind: string
          meta?: Json
          ref: string
          service: string
          usd: number
        }
        Update: {
          at?: string
          id?: string
          kind?: string
          meta?: Json
          ref?: string
          service?: string
          usd?: number
        }
        Relationships: []
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
      work_briefs: {
        Row: {
          client_note: string | null
          manual_note: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          client_note?: string | null
          manual_note?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          client_note?: string | null
          manual_note?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_briefs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      work_notes: {
        Row: {
          author_id: string
          author_role: string
          body: string
          created_at: string
          deliverable_id: string
          id: string
        }
        Insert: {
          author_id: string
          author_role: string
          body: string
          created_at?: string
          deliverable_id: string
          id?: string
        }
        Update: {
          author_id?: string
          author_role?: string
          body?: string
          created_at?: string
          deliverable_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_notes_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      blog_cron_hit: { Args: { path: string }; Returns: number }
      blog_view_bump: {
        Args: { p_day: string; p_slug: string }
        Returns: undefined
      }
      blog_visit_mark: {
        Args: { p_landing: boolean; p_slug: string; p_visitor: string }
        Returns: undefined
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
