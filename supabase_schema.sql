-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  username text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for user progress/data
create table user_progress (
  user_id uuid references auth.users not null primary key,
  history jsonb default '[]'::jsonb,
  saved_state jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
-- Profiles: Everyone can read, users can update their own
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);
create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- User Progress: Users can read/write their own
alter table user_progress enable row level security;
create policy "Users can view own progress" on user_progress
  for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on user_progress
  for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on user_progress
  for update using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, username, is_admin)
  values (new.id, new.email, new.raw_user_meta_data->>'username', false);
  
  insert into public.user_progress (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
