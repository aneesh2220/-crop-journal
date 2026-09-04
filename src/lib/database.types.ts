export type CropStage = 'preparation' | 'sowing' | 'growth' | 'flowering' | 'harvest'
export type TaskType = 'irrigation' | 'fertilizer' | 'spraying' | 'inspection' | 'harvesting' | 'other'
export type TaskStatus = 'pending' | 'done' | 'overdue'
export type NotificationType = 'weather' | 'irrigation' | 'task' | 'market' | 'system'
export type MessageRole = 'user' | 'assistant'
export type CropLogType =
  | 'sowing' | 'irrigation' | 'fertilizer' | 'spraying' | 'weeding'
  | 'observation' | 'problem' | 'harvest' | 'expense' | 'other'
export type Units = 'metric' | 'imperial'

// These are declared with `type`, not `interface` — interfaces don't satisfy
// `Record<string, unknown>` in the conditional-type checks postgrest-js uses to
// resolve Row/Insert/Update, which silently collapses every table to `never`.
export type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  language: string
  theme: 'light' | 'dark' | 'system'
  units: Units
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  voice_enabled: boolean
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export type Farm = {
  id: string
  user_id: string
  name: string
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  land_size: number | null
  land_unit: 'acre' | 'hectare' | 'bigha'
  soil_type: string | null
  irrigation_type: string | null
  water_source: string | null
  created_at: string
  updated_at: string
}

export type Crop = {
  id: string
  farm_id: string
  user_id: string
  name: string
  variety: string | null
  stage: CropStage
  stage_progress: number
  planting_date: string | null
  expected_harvest_date: string | null
  actual_harvest_date: string | null
  area: number | null
  area_unit: 'acre' | 'hectare' | 'bigha'
  health_score: number | null
  status: 'active' | 'harvested' | 'failed'
  notes: string | null
  created_at: string
  updated_at: string
}

export type FarmTask = {
  id: string
  user_id: string
  farm_id: string | null
  crop_id: string | null
  title: string
  type: TaskType
  due_date: string
  status: TaskStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type Conversation = {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  conversation_id: string
  user_id: string
  role: MessageRole
  content: string
  image_url: string | null
  audio_url: string | null
  created_at: string
}

export type CropDiagnosis = {
  id: string
  user_id: string
  crop_id: string | null
  image_url: string | null
  symptoms: string | null
  diagnosis: {
    problem: string
    confidence: number
    causes: string[]
    treatment: string[]
    prevention: string[]
    severity: 'low' | 'medium' | 'high'
  } | null
  created_at: string
}

export type SoilAnalysis = {
  id: string
  user_id: string
  farm_id: string | null
  image_url: string | null
  ph: number | null
  nitrogen: number | null
  phosphorus: number | null
  potassium: number | null
  texture: string | null
  analysis: {
    summary: string
    health_score: number
    recommendations: string[]
    suitable_crops: string[]
  } | null
  created_at: string
}

export type AppNotification = {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  created_at: string
}

export type CropLog = {
  id: string
  crop_id: string
  user_id: string
  entry_date: string
  type: CropLogType
  note: string | null
  photo_url: string | null
  location_lat: number | null
  location_lng: number | null
  cost: number | null
  created_at: string
}

// `Relationships` is required by postgrest-js's GenericTable constraint even though we
// don't use FK-embedding queries here — omitting it makes every Insert/Update resolve to
// `never` instead of our actual row type.
type NoRelationships = { Relationships: [] }

export type Database = {
  // Matches the shape the Supabase CLI now emits (`supabase gen types`) — recent
  // supabase-js versions use this to resolve the correct PostgREST typing behavior.
  __InternalSupabase: {
    PostgrestVersion: '13'
  }
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> } & NoRelationships
      farms: { Row: Farm; Insert: Partial<Farm> & { user_id: string; name: string }; Update: Partial<Farm> } & NoRelationships
      crops: { Row: Crop; Insert: Partial<Crop> & { farm_id: string; user_id: string; name: string }; Update: Partial<Crop> } & NoRelationships
      crop_logs: { Row: CropLog; Insert: Partial<CropLog> & { crop_id: string; user_id: string }; Update: Partial<CropLog> } & NoRelationships
      farm_tasks: { Row: FarmTask; Insert: Partial<FarmTask> & { user_id: string; title: string; type: TaskType; due_date: string }; Update: Partial<FarmTask> } & NoRelationships
      conversations: { Row: Conversation; Insert: Partial<Conversation> & { user_id: string; title: string }; Update: Partial<Conversation> } & NoRelationships
      messages: { Row: Message; Insert: Partial<Message> & { conversation_id: string; user_id: string; role: MessageRole; content: string }; Update: Partial<Message> } & NoRelationships
      crop_diagnoses: { Row: CropDiagnosis; Insert: Partial<CropDiagnosis> & { user_id: string }; Update: Partial<CropDiagnosis> } & NoRelationships
      soil_analyses: { Row: SoilAnalysis; Insert: Partial<SoilAnalysis> & { user_id: string }; Update: Partial<SoilAnalysis> } & NoRelationships
      notifications: { Row: AppNotification; Insert: Partial<AppNotification> & { user_id: string; type: NotificationType; title: string; body: string }; Update: Partial<AppNotification> } & NoRelationships
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
