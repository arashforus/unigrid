const BASE = import.meta.env.BASE_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}api/admin${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}) as any);
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export type AdminUniversity = {
  id: number;
  name_en: string;
  name_tr: string;
  name_fa: string;
  name_ar: string;
  slug: string;
  type: string;
  city_en: string;
  city_tr: string;
  city_fa: string;
  city_ar: string;
  website_url: string | null;
  apply_url_international: string | null;
  logo_url: string | null;
  description_en: string | null;
  description_tr: string | null;
  description_fa: string | null;
  description_ar: string | null;
};

export type AdminFaculty = {
  id: number;
  name_en: string;
  university_id: number;
  university_name: string;
};

export type AdminTuitionFee = {
  id?: number;
  program_id?: number;
  academic_year: string;
  domestic_fee: string | null;
  international_fee: string | null;
  currency: string;
};

export type AdminProgram = {
  id: number;
  faculty_id: number;
  name_en: string;
  name_tr: string;
  name_fa: string;
  name_ar: string;
  yok_atlas_code: string | null;
  degree_type: string;
  language: string;
  duration_years: number;
  is_active: boolean;
  faculty_name: string | null;
  university_name: string | null;
  university_id: number | null;
  tuition_fees: AdminTuitionFee[];
};

export type AdminTask = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  desired_field: string | null;
  degree_type: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export type AdminSettings = {
  site_name: string;
  site_tagline: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  featured_university_slug: string;
  maintenance_mode: string;
};

export type AdminDashboard = {
  total_users: number;
  total_universities: number;
  total_programs: number;
  total_inquiries: number;
  new_inquiries: number;
  recent_inquiries: AdminTask[];
  inquiries_by_day: { day: string; count: number }[];
};

export type AdminStats = {
  by_degree: { label: string; count: number }[];
  by_language: { label: string; count: number }[];
  by_university_type: { label: string; count: number }[];
  by_city: { label: string; count: number }[];
  by_task_status: { label: string; count: number }[];
  by_user_role: { label: string; count: number }[];
  signups_by_day: { day: string; count: number }[];
};

export type CrawlStats = {
  universities_seen: number;
  universities_created: number;
  universities_updated: number;
  faculties_created: number;
  programs_seen: number;
  programs_created: number;
  programs_updated: number;
  fees_updated: number;
  errors: string[];
};

export type AdminCrawlJob = {
  id: number;
  source: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  triggered_by: number | null;
  started_at: string;
  finished_at: string | null;
  stats: CrawlStats;
  error: string | null;
};

export type FeeCrawlUniversityResult = {
  university_id: number;
  university_name: string;
  website_url: string | null;
  status: 'pending' | 'no_url' | 'fetching' | 'extracting' | 'done' | 'failed';
  pages_fetched: number;
  fees_saved: number;
  error?: string;
};

export type FeeCrawlStats = {
  universities_total: number;
  universities_done: number;
  universities_with_fees: number;
  universities_no_url: number;
  universities_failed: number;
  fees_saved: number;
  results: FeeCrawlUniversityResult[];
};

export type AdminFeeCrawlJob = {
  id: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  triggered_by: number | null;
  started_at: string;
  finished_at: string | null;
  stats: FeeCrawlStats;
  error: string | null;
};

export type FeeCrawlerUniversity = {
  id: number;
  name_en: string;
  slug: string;
  website_url: string | null;
};

export type FoundFee = {
  fee_id: number;
  program_id: number;
  program_name_en: string;
  program_name_tr: string;
  degree_type: string;
  academic_year: string;
  domestic_fee: string | null;
  international_fee: string | null;
  currency: string;
};

export const adminApi = {
  dashboard: () => request<AdminDashboard>('/dashboard'),
  stats: () => request<AdminStats>('/stats'),
  users: {
    list: () => request<AdminUser[]>('/users'),
    create: (data: { name: string; email: string; password: string; role: string }) =>
      request<AdminUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; email?: string; password?: string; role?: string }) =>
      request<AdminUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: number) => request<{ ok: true }>(`/users/${id}`, { method: 'DELETE' }),
  },
  universities: {
    list: () => request<AdminUniversity[]>('/universities'),
    create: (data: Partial<AdminUniversity>) =>
      request<AdminUniversity>('/universities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<AdminUniversity>) =>
      request<AdminUniversity>(`/universities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request<{ ok: true }>(`/universities/${id}`, { method: 'DELETE' }),
    findUrl: (id: number) => request<{ url: string | null }>(`/universities/${id}/find-url`, { method: 'POST' }),
  },
  faculties: {
    list: () => request<AdminFaculty[]>('/faculties'),
  },
  programs: {
    list: () => request<AdminProgram[]>('/programs'),
    create: (data: Record<string, unknown>) =>
      request<AdminProgram>('/programs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<AdminProgram>(`/programs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request<{ ok: true }>(`/programs/${id}`, { method: 'DELETE' }),
  },
  tasks: {
    list: () => request<AdminTask[]>('/tasks'),
    updateStatus: (id: number, status: string) =>
      request<AdminTask>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  settings: {
    get: () => request<AdminSettings>('/settings'),
    update: (data: Partial<AdminSettings>) =>
      request<AdminSettings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
  crawler: {
    run: () => request<AdminCrawlJob>('/crawler/run', { method: 'POST' }),
    jobs: {
      list: () => request<AdminCrawlJob[]>('/crawler/jobs'),
      get: (id: number) => request<AdminCrawlJob>(`/crawler/jobs/${id}`),
    },
  },
  feeCrawler: {
    run: (universityIds?: number[]) =>
      request<AdminFeeCrawlJob>('/fee-crawler/run', {
        method: 'POST',
        body: JSON.stringify({ university_ids: universityIds ?? [] }),
      }),
    jobs: {
      list: () => request<AdminFeeCrawlJob[]>('/fee-crawler/jobs'),
      get: (id: number) => request<AdminFeeCrawlJob>(`/fee-crawler/jobs/${id}`),
    },
    universities: () => request<FeeCrawlerUniversity[]>('/fee-crawler/universities'),
    universityFees: (id: number) => request<FoundFee[]>(`/fee-crawler/universities/${id}/fees`),
  },
};
