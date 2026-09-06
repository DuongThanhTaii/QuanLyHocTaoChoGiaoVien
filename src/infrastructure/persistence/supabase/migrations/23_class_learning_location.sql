-- Default learning details for a class. Individual schedule slots can still
-- provide their own room when a particular session is held elsewhere.
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS online_meeting_url TEXT;

COMMENT ON COLUMN public.classes.location IS
  'Địa chỉ hoặc địa điểm học mặc định của lớp.';

COMMENT ON COLUMN public.classes.online_meeting_url IS
  'Liên kết học trực tuyến mặc định (Google Meet, Zoom, Microsoft Teams...).';
