create table mainlines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '考研',
  exam_date date not null,
  goal_desc text not null default '',
  archived boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  mainline_id uuid not null references mainlines(id) on delete cascade,
  name text not null,
  type text not null default 'subject',
  status text not null default 'active',
  repeat_rule text not null default 'daily',
  order_index int not null default 0,
  last_record_at date,
  created_at timestamptz not null default now()
);

create table nodes (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  weight text not null default 'main',
  kind text not null default 'normal',
  is_crossing boolean not null default false,
  plan_date date,
  plan_start time,
  plan_end time,
  done_date date,
  done_content text,
  status text not null default 'planned',
  mood text,
  mood_note text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table substeps (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references nodes(id) on delete cascade,
  content text not null,
  checked boolean not null default false,
  order_index int not null default 0
);

create table diaries (
  id uuid primary key default gen_random_uuid(),
  diary_date date not null,
  content text not null,
  images jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  mood text,
  created_at timestamptz not null default now()
);

create table footprints (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  footprint_date date not null,
  created_at timestamptz not null default now()
);

create index idx_branches_mainline on branches(mainline_id);
create index idx_nodes_branch on nodes(branch_id);
create index idx_substeps_node on substeps(node_id);
create index idx_footprints_branch on footprints(branch_id);

alter table mainlines enable row level security;
alter table branches enable row level security;
alter table nodes enable row level security;
alter table substeps enable row level security;
alter table diaries enable row level security;
alter table footprints enable row level security;

create policy "mainlines_anon_select" on mainlines for select to anon using (true);
create policy "mainlines_anon_insert" on mainlines for insert to anon with check (true);
create policy "mainlines_anon_update" on mainlines for update to anon using (true);
create policy "mainlines_anon_delete" on mainlines for delete to anon using (true);
create policy "mainlines_auth_select" on mainlines for select to authenticated using (true);
create policy "mainlines_auth_insert" on mainlines for insert to authenticated with check (true);
create policy "mainlines_auth_update" on mainlines for update to authenticated using (true);
create policy "mainlines_auth_delete" on mainlines for delete to authenticated using (true);

create policy "branches_anon_select" on branches for select to anon using (true);
create policy "branches_anon_insert" on branches for insert to anon with check (true);
create policy "branches_anon_update" on branches for update to anon using (true);
create policy "branches_anon_delete" on branches for delete to anon using (true);
create policy "branches_auth_select" on branches for select to authenticated using (true);
create policy "branches_auth_insert" on branches for insert to authenticated with check (true);
create policy "branches_auth_update" on branches for update to authenticated using (true);
create policy "branches_auth_delete" on branches for delete to authenticated using (true);

create policy "nodes_anon_select" on nodes for select to anon using (true);
create policy "nodes_anon_insert" on nodes for insert to anon with check (true);
create policy "nodes_anon_update" on nodes for update to anon using (true);
create policy "nodes_anon_delete" on nodes for delete to anon using (true);
create policy "nodes_auth_select" on nodes for select to authenticated using (true);
create policy "nodes_auth_insert" on nodes for insert to authenticated with check (true);
create policy "nodes_auth_update" on nodes for update to authenticated using (true);
create policy "nodes_auth_delete" on nodes for delete to authenticated using (true);

create policy "substeps_anon_select" on substeps for select to anon using (true);
create policy "substeps_anon_insert" on substeps for insert to anon with check (true);
create policy "substeps_anon_update" on substeps for update to anon using (true);
create policy "substeps_anon_delete" on substeps for delete to anon using (true);
create policy "substeps_auth_select" on substeps for select to authenticated using (true);
create policy "substeps_auth_insert" on substeps for insert to authenticated with check (true);
create policy "substeps_auth_update" on substeps for update to authenticated using (true);
create policy "substeps_auth_delete" on substeps for delete to authenticated using (true);

create policy "diaries_anon_select" on diaries for select to anon using (true);
create policy "diaries_anon_insert" on diaries for insert to anon with check (true);
create policy "diaries_anon_update" on diaries for update to anon using (true);
create policy "diaries_anon_delete" on diaries for delete to anon using (true);
create policy "diaries_auth_select" on diaries for select to authenticated using (true);
create policy "diaries_auth_insert" on diaries for insert to authenticated with check (true);
create policy "diaries_auth_update" on diaries for update to authenticated using (true);
create policy "diaries_auth_delete" on diaries for delete to authenticated using (true);

create policy "footprints_anon_select" on footprints for select to anon using (true);
create policy "footprints_anon_insert" on footprints for insert to anon with check (true);
create policy "footprints_anon_update" on footprints for update to anon using (true);
create policy "footprints_anon_delete" on footprints for delete to anon using (true);
create policy "footprints_auth_select" on footprints for select to authenticated using (true);
create policy "footprints_auth_insert" on footprints for insert to authenticated with check (true);
create policy "footprints_auth_update" on footprints for update to authenticated using (true);
create policy "footprints_auth_delete" on footprints for delete to authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit)
values ('yoro_images', 'yoro_images', true, 1048576);

create policy "yoro_images_public_read" on storage.objects for select using (bucket_id = 'yoro_images');
create policy "yoro_images_anon_insert" on storage.objects for insert to anon with check (bucket_id = 'yoro_images');
create policy "yoro_images_anon_update" on storage.objects for update to anon with check (bucket_id = 'yoro_images');
create policy "yoro_images_anon_delete" on storage.objects for delete to anon using (bucket_id = 'yoro_images');
create policy "yoro_images_auth_insert" on storage.objects for insert to authenticated with check (bucket_id = 'yoro_images');
create policy "yoro_images_auth_update" on storage.objects for update to authenticated with check (bucket_id = 'yoro_images');
create policy "yoro_images_auth_delete" on storage.objects for delete to authenticated using (bucket_id = 'yoro_images');

insert into mainlines (id, name, category, exam_date, goal_desc, archived, order_index) values
  ('11111111-1111-1111-1111-111111111111', '考研', '考研', '2027-12-20', '成功上岸目标院校', false, 0),
  ('22222222-2222-2222-2222-222222222222', '蓝桥杯', '学科竞赛', '2027-04-11', '拿下一个省一', false, 1);

insert into branches (id, mainline_id, name, type, status, repeat_rule, order_index, last_record_at) values
  ('aaaa0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '数学', 'subject', 'active', 'daily', 0, current_date - 2),
  ('aaaa0001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '英语', 'subject', 'active', 'daily', 1, current_date - 3),
  ('aaaa0001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '专业课', 'subject', 'hibernate', 'daily', 2, current_date - 20),
  ('aaaa0001-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', '算法', 'subject', 'active', 'daily', 0, current_date - 1),
  ('aaaa0001-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', '数据结构', 'subject', 'active', 'daily', 1, current_date - 4),
  ('bbbb0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '背单词', 'habit', 'active', 'daily', 3, current_date - 1),
  ('bbbb0001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '运动', 'habit', 'active', 'weekly', 4, current_date - 2);

insert into nodes (branch_id, name, weight, kind, status, done_date, done_content, order_index) values
  ('aaaa0001-0000-0000-0000-000000000001', '高数第一章过完', 'main', 'normal', 'done', current_date - 24, '极限与连续搞定', 0),
  ('aaaa0001-0000-0000-0000-000000000001', '高数第二章过完', 'main', 'normal', 'done', current_date - 22, '导数与微分搞定', 1),
  ('aaaa0001-0000-0000-0000-000000000001', '1000题第一章', 'side', 'normal', 'done', current_date - 21, '正确率过八成', 2),
  ('aaaa0001-0000-0000-0000-000000000001', '高数第三章过完', 'main', 'normal', 'done', current_date - 19, '一元积分收尾', 3),
  ('aaaa0001-0000-0000-0000-000000000001', '线代第一章', 'main', 'normal', 'done', current_date - 17, '行列式过完', 4),
  ('aaaa0001-0000-0000-0000-000000000001', '线代第二章', 'main', 'normal', 'done', current_date - 15, '矩阵与秩过完', 5),
  ('aaaa0001-0000-0000-0000-000000000001', '真题2018一套', 'side', 'normal', 'done', current_date - 13, '掐表做完加订正', 6),
  ('aaaa0001-0000-0000-0000-000000000001', '错题第一遍', 'bypass', 'normal', 'done', current_date - 12, '错题本过了一轮', 7),
  ('aaaa0001-0000-0000-0000-000000000001', '高数第四章过完', 'main', 'normal', 'done', current_date - 10, '多元微分过完', 8),
  ('aaaa0001-0000-0000-0000-000000000001', '概率论第一章', 'main', 'normal', 'done', current_date - 8, '随机事件过完', 9),
  ('aaaa0001-0000-0000-0000-000000000001', '真题2019一套', 'side', 'normal', 'done', current_date - 5, '大题稳住了', 10),
  ('aaaa0001-0000-0000-0000-000000000001', '真题2020一套', 'side', 'normal', 'done', current_date - 2, '选填只错两个', 11);
insert into nodes (branch_id, name, weight, kind, status, plan_date, plan_start, plan_end, order_index) values
  ('aaaa0001-0000-0000-0000-000000000001', '复习数学·概率论第二章', 'main', 'normal', 'planned', date_trunc('week', current_date)::date + 2, '15:00', '17:00', 12),
  ('aaaa0001-0000-0000-0000-000000000001', '概率论第三章', 'main', 'normal', 'planned', date_trunc('week', current_date)::date + 5, '19:00', '21:00', 13),
  ('aaaa0001-0000-0000-0000-000000000001', '真题2021一套', 'side', 'normal', 'planned', date_trunc('week', current_date)::date + 9, '14:00', '17:00', 14);

insert into nodes (branch_id, name, weight, kind, status, done_date, done_content, order_index) values
  ('aaaa0001-0000-0000-0000-000000000002', '单词List1-20', 'main', 'normal', 'done', current_date - 26, '一轮背完', 0),
  ('aaaa0001-0000-0000-0000-000000000002', '长难句第一章', 'main', 'normal', 'done', current_date - 24, '结构拆分上手了', 1),
  ('aaaa0001-0000-0000-0000-000000000002', '阅读精读10篇', 'side', 'normal', 'done', current_date - 20, '精读完订正完', 2),
  ('aaaa0001-0000-0000-0000-000000000002', '单词List21-40', 'main', 'normal', 'done', current_date - 16, '二轮过半', 3),
  ('aaaa0001-0000-0000-0000-000000000002', '休整·看完一本书', 'side', 'supply', 'done', current_date - 14, '给自己放了个假', 4),
  ('aaaa0001-0000-0000-0000-000000000002', '阅读精读11-20', 'side', 'normal', 'done', current_date - 11, '正确率上来了', 5),
  ('aaaa0001-0000-0000-0000-000000000002', '完形第一轮', 'bypass', 'normal', 'done', current_date - 9, '套路摸清了', 6),
  ('aaaa0001-0000-0000-0000-000000000002', '真题阅读2019一套', 'side', 'normal', 'done', current_date - 3, '只错一个', 7);
insert into nodes (branch_id, name, weight, kind, is_crossing, status, plan_date, plan_start, plan_end, order_index) values
  ('aaaa0001-0000-0000-0000-000000000002', '长难句第二章', 'main', 'normal', true, 'planned', date_trunc('week', current_date)::date + 3, '09:00', '10:30', 8),
  ('aaaa0001-0000-0000-0000-000000000002', '单词二轮收尾', 'main', 'normal', false, 'planned', date_trunc('week', current_date)::date + 6, '08:30', '09:30', 9);

insert into nodes (branch_id, name, weight, kind, status, plan_date, plan_start, plan_end, order_index) values
  ('aaaa0001-0000-0000-0000-000000000003', '数据结构第一章', 'main', 'normal', 'planned', date_trunc('week', current_date)::date + 8, '15:00', '17:00', 0),
  ('aaaa0001-0000-0000-0000-000000000003', '操作系统第一章', 'main', 'normal', 'planned', date_trunc('week', current_date)::date + 12, '15:00', '17:00', 1);

insert into nodes (branch_id, name, weight, kind, status, done_date, done_content, order_index) values
  ('aaaa0001-0000-0000-0000-000000000004', 'DP专题入门', 'main', 'normal', 'done', current_date - 18, '背包九讲过了一半', 0),
  ('aaaa0001-0000-0000-0000-000000000004', '贪心专题', 'side', 'normal', 'done', current_date - 10, '经典题清完', 1),
  ('aaaa0001-0000-0000-0000-000000000004', '搜索剪枝', 'side', 'normal', 'done', current_date - 1, '剪枝套路能写出来', 2);
insert into nodes (branch_id, name, weight, kind, status, plan_date, plan_start, plan_end, order_index) values
  ('aaaa0001-0000-0000-0000-000000000004', '算法专题·图论', 'main', 'normal', 'planned', date_trunc('week', current_date)::date + 4, '14:00', '16:00', 3),
  ('aaaa0001-0000-0000-0000-000000000004', '往年卷一套', 'side', 'normal', 'planned', date_trunc('week', current_date)::date + 7, '14:00', '17:00', 4);

insert into nodes (branch_id, name, weight, kind, status, done_date, done_content, order_index) values
  ('aaaa0001-0000-0000-0000-000000000005', '链表与数组', 'main', 'normal', 'done', current_date - 16, '手写模板收尾', 0),
  ('aaaa0001-0000-0000-0000-000000000005', '树的基础', 'main', 'normal', 'done', current_date - 4, '遍历与建树过完', 1);
insert into nodes (branch_id, name, weight, kind, status, plan_date, plan_start, plan_end, order_index) values
  ('aaaa0001-0000-0000-0000-000000000005', '图的基础', 'main', 'normal', 'planned', date_trunc('week', current_date)::date + 6, '19:00', '21:00', 2);

insert into substeps (node_id, content, checked, order_index)
select n.id, s.content, s.checked, s.oi
from nodes n, (values
  ('看例句拆五个长难句', false, 0),
  ('做课后练习10题', false, 1),
  ('整理定语从句笔记', false, 2)
) as s(content, checked, oi)
where n.branch_id = 'aaaa0001-0000-0000-0000-000000000002' and n.is_crossing = true;

insert into footprints (branch_id, footprint_date)
select 'bbbb0001-0000-0000-0000-000000000001', d::date
from generate_series(current_date - 42, current_date - 1, interval '1 day') as d;

insert into footprints (branch_id, footprint_date)
select 'bbbb0001-0000-0000-0000-000000000002', d::date
from unnest(array[
  current_date - 1, current_date - 3, current_date - 5,
  current_date - 8, current_date - 10, current_date - 12,
  current_date - 15, current_date - 17, current_date - 19,
  current_date - 22, current_date - 24, current_date - 26
]) as d;

insert into diaries (diary_date, content, images, tags, mood) values
  (current_date - 2, '背了三遍还是记不住', '["https://miaoda-site-img.cdn.bcebos.com/images/baidu_image_search_58393231-e40e-4d92-9ea4-b8bc7cc2e029.jpg"]'::jsonb, '["英语"]'::jsonb, 'anxious'),
  (current_date - 1, '今天状态不错，一章顺下来了', '[]'::jsonb, '[]'::jsonb, 'energized'),
  (current_date, '有点慌，进度比想象慢', '[]'::jsonb, '[]'::jsonb, 'low');