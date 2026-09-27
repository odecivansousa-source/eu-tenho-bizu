export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  category_id?: string;
  name: string;
  kind: "concurso" | "detran";
  description: string | null;
  is_active: boolean;
  slug?: string;
  icon?: string | null;
  sort_order?: number;
};

export type Subject = {
  id: string;
  category_id: string;
  name: string;
};

export type Question = {
  id: string;
  subject_id: string;
  statement: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  difficulty: string;
  tags: string[];
  is_active: boolean;
};

export type Attempt = {
  id: string;
  user_id: string;
  exam_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  blank_count: number;
  score: number;
  duration_seconds: number;
};