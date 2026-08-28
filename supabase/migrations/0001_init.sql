-- 家庭AI陪诊师 MVP 数据库迁移 v0.2
-- 创建日期：2026-08-27
-- 对应 ARCHITECTURE.md §5 数据模型

-- 1. 用户档案（扩展 Supabase auth.users）
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text,
  avatar_url text,
  role text check (role in ('patient','family')),   -- 黑客松简化：当前登录态角色
  created_at timestamptz default now()
);

-- 2. 就诊记录
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) not null,
  status text not null check (
    status in ('chief_complaint_pending',   -- 待填主诉
               'chief_complaint_done',     -- 主诉完成
               'transcribing',             -- 实时 ASR 转写中
               'summarizing',              -- AI 摘要生成中
               'completed')                -- 摘要已生成
  ),
  chief_complaint_text text,               -- 结构化主诉文本
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. 主诉对话
create table if not exists public.chief_complaint_chats (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid references public.consultations(id) on delete cascade,
  role text check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz default now()
);

-- 4. 转写片段（实时 ASR 推送，每行一段）
create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid references public.consultations(id) on delete cascade,
  sequence_no int not null,                -- 片段顺序号
  content text not null,                   -- ASR 返回的文本片段
  is_final boolean default true,           -- false=partial 中间结果, true=final 终稿
  speaker text check (speaker in ('doctor','patient','family','unknown')),
  created_at timestamptz default now()
);

create index if not exists transcripts_consultation_seq_idx
  on public.transcripts (consultation_id, sequence_no);

-- 5. 就诊摘要
create table if not exists public.consultation_summaries (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid references public.consultations(id) on delete cascade,
  diagnosis text,                          -- 诊断
  doctor_advice text,                      -- 医嘱整理
  medications jsonb default '[]'::jsonb,  -- [{name, dosage, frequency, duration}]
  follow_ups jsonb default '[]'::jsonb,   -- [{type, time, description}]
  warnings text[] default '{}',            -- 注意事项
  created_at timestamptz default now()
);

-- 触发器：新用户注册时自动创建 profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 更新时间戳触发器
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_consultations_updated on public.consultations;
create trigger on_consultations_updated
  before update on public.consultations
  for each row execute function public.handle_updated_at();

-- RLS 策略：患者只能看自己的数据
-- 家属端访问用 service role key 绕过 RLS（hackathon only，赛后改为家庭关系表）
alter table public.profiles enable row level security;
create policy "own_profile" on public.profiles
  for all using (id = auth.uid());

alter table public.consultations enable row level security;
create policy "own_consultations" on public.consultations
  for all using (patient_id = auth.uid());

alter table public.chief_complaint_chats enable row level security;
create policy "own_chats" on public.chief_complaint_chats
  for all using (
    exists (
      select 1 from public.consultations c
      where c.id = chief_complaint_chats.consultation_id
        and c.patient_id = auth.uid()
    )
  );

alter table public.transcripts enable row level security;
create policy "own_transcripts" on public.transcripts
  for all using (
    exists (
      select 1 from public.consultations c
      where c.id = transcripts.consultation_id
        and c.patient_id = auth.uid()
    )
  );

alter table public.consultation_summaries enable row level security;
create policy "own_summaries" on public.consultation_summaries
  for all using (
    exists (
      select 1 from public.consultations c
      where c.id = consultation_summaries.consultation_id
        and c.patient_id = auth.uid()
    )
  );
