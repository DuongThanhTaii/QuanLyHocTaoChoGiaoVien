-- One-time repair for account 71391ff3-3772-4354-be5c-80a6ee50a542.
-- Run this entire script once in Supabase SQL Editor. It is atomic: any
-- unexpected duplicate session/exercise stops the transaction without changes.
begin;

do $$
declare
  canonical_student uuid := '23f70877-6dc0-46a8-a90c-d882a6fdc7ed';
  duplicate_programming uuid := 'c8cf70cf-44f1-486f-b239-36873a015795';
  duplicate_probability uuid := '08ac2eed-eed1-4675-9c6d-1319e97eb174';
  empty_duplicate uuid := '0e25cfd8-888e-454a-b8e7-9bb297de0a52';
  duplicate_probability_enrollment uuid := '78b292cb-2476-48a9-bfa0-531d6651f6a6';
begin
  if not exists (select 1 from public.students where id = canonical_student and user_id = '71391ff3-3772-4354-be5c-80a6ee50a542') then
    raise exception 'Canonical student/account link is not valid; nothing was changed.';
  end if;

  if exists (select 1 from public.attendance_records source join public.attendance_records target on target.session_id = source.session_id and target.student_id = canonical_student where source.student_id in (duplicate_programming, duplicate_probability)) then
    raise exception 'Attendance conflict found; review it before merging.';
  end if;
  if exists (select 1 from public.assignment_submissions source join public.assignment_submissions target on target.exercise_id = source.exercise_id and target.student_id = canonical_student where source.student_id in (duplicate_programming, duplicate_probability)) then
    raise exception 'Assignment submission conflict found; review it before merging.';
  end if;

  update public.attendance_records set student_id = canonical_student where student_id in (duplicate_programming, duplicate_probability);
  -- Move evaluations that do not already exist on the canonical profile.
  update public.session_evaluations source
  set student_id = canonical_student
  where source.student_id in (duplicate_programming, duplicate_probability)
    and not exists (
      select 1 from public.session_evaluations target
      where target.session_id = source.session_id and target.student_id = canonical_student
    );

  -- Keep the canonical rating when an evaluation already exists. Preserve a
  -- source comment only if the canonical record has no comment; otherwise
  -- append it with a merge marker instead of silently discarding it.
  update public.session_evaluations target
  set feedback = case
    when coalesce(trim(target.feedback), '') = '' then source.feedback
    when coalesce(trim(source.feedback), '') = '' or target.feedback = source.feedback then target.feedback
    else target.feedback || E'\n[Dữ liệu gộp] ' || source.feedback
  end
  from public.session_evaluations source
  where target.student_id = canonical_student
    and source.student_id in (duplicate_programming, duplicate_probability)
    and target.session_id = source.session_id;
  update public.assignment_submissions set student_id = canonical_student where student_id in (duplicate_programming, duplicate_probability);
  update public.invoices set student_id = canonical_student where student_id in (duplicate_programming, duplicate_probability);
  update public.student_guardians set student_id = canonical_student where student_id in (duplicate_programming, duplicate_probability) and not exists (select 1 from public.student_guardians target where target.student_id = canonical_student and target.guardian_id = public.student_guardians.guardian_id);

  update public.enrollments set student_id = canonical_student where student_id = duplicate_programming;
  delete from public.enrollments where id = duplicate_probability_enrollment and student_id = duplicate_probability;
  delete from public.student_guardians where student_id in (duplicate_programming, duplicate_probability, empty_duplicate);
  delete from public.students where id in (duplicate_programming, duplicate_probability, empty_duplicate);
end $$;

commit;
