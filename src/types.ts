export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: "student" | "admin";
  access_expires_at: string | null;
};

export type Category = {
  id: string;
  name: string;
  type: "concurso" | "detran";
  description: string | null;
  active: boolean;
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
  correct_option: "A" | "B" | "C" | "D" | "E";
  explanation: string | null;
};

export type Attempt = {
  id: string;
  user_id: string;
  category_id: string;
  score: number;
  total: number;
  created_at: string;
};