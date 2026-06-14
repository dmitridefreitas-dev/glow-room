-- =============================================================================
-- The Glow Room — challenge content seed (Phase 1)
-- Run AFTER 0001_init.sql. Safe to re-run (on conflict do nothing).
-- =============================================================================

insert into public.challenge_days
  (challenge_type, day_number, movement_task, skin_task, mindset_prompt)
values
-- ---------------- GLOW UP (30 days) ----------------
('glow_up', 1,  '20-minute walk, outside if you can. Just move — no rules beyond the clock.', 'Cleanser only — wash your face properly, morning and night.', 'Write the version of you you''re hoping to meet in 30 days. Be specific — what does her morning look like?'),
('glow_up', 2,  '20 minutes — yesterday''s walk or a gentle stretch/mobility flow.', 'Cleanser, morning and night. Consistency is the whole secret.', 'What''s one small thing you did today that your future self would be proud of?'),
('glow_up', 3,  '20-minute walk + 5 bodyweight squats whenever you remember.', 'Cleanser AM/PM. Add a night moisturiser if you have one.', 'Write down three things you''ve been avoiding — and one sentence on why.'),
('glow_up', 4,  '20 minutes of anything that raises your heart rate.', 'SPF day. Why it matters more than any serum, how much to use, every morning.', 'What would you do this week if you knew you couldn''t fail at it?'),
('glow_up', 5,  '20-minute walk with a podcast or playlist — let your mind wander.', 'Cleanse, moisturise, SPF in the morning.', 'Name one belief about yourself that''s been holding you back. Where did it come from?'),
('glow_up', 6,  'Circuit x3: 10 squats, 10 push-ups (knees fine), 20-second plank.', 'Full simple routine: cleanse, moisturise, SPF.', 'Write about a moment this week you felt genuinely good. What caused it?'),
('glow_up', 7,  'Dance day — five songs you love, move however you want. It counts.', 'Your routine, plus take a Day-7 progress photo in the same light as Day 1.', 'Reflect on week one. What surprised you about yourself?'),
('glow_up', 8,  'The hard day. Do the smallest version — a 20-minute walk is enough. Just don''t skip.', 'Keep it gentle: cleanse and moisturise. Be kind to your skin and yourself.', 'Day 8 is the day most people quit — that''s by design. Write why you started, in your own words.'),
('glow_up', 9,  '15-minute bodyweight set: squats, lunges, push-ups, repeat.', 'Cleanse, add a hydrating serum or richer moisturiser at night.', 'What does momentum feel like in your body right now?'),
('glow_up', 10, '25-minute walk — pick a route you''ve never taken.', 'Introduce a Vitamin C serum in the morning, before moisturiser and SPF.', 'Write a short letter to yourself for Day 30. What do you hope is true?'),
('glow_up', 11, 'Yoga or mobility flow, 20 minutes (follow any free video).', 'Cleanse, Vitamin C, SPF. You''re building a real routine now.', 'What are you tolerating in your life that you know you shouldn''t be?'),
('glow_up', 12, '20 minutes of cardio you actually enjoy.', 'Gentle exfoliation, once this week only — don''t overdo it.', 'Describe your ideal ordinary day, hour by hour. No fantasy — a real Tuesday.'),
('glow_up', 13, 'Strength circuit x3 (squats, push-ups, glute bridges, plank).', 'Full routine + a little lip care. Small details count.', 'Who genuinely inspires you, and what specifically about them?'),
('glow_up', 14, 'Dance or brisk walk, 25 minutes.', 'Full routine + take your Day-14 progress photo.', 'Reflect on week two. What has actually changed — even slightly?'),
('glow_up', 15, '30 minutes of movement you enjoy. This is the turning point — feel it.', 'Introduce a richer night cream (or a gentle retinol alternative).', 'Something feels different around now. Name it. What''s shifting in you?'),
('glow_up', 16, '20-minute strength session.', 'Your full routine, morning and night.', 'What boundary do you need to set this week — and with whom?'),
('glow_up', 17, '25-minute walk + a proper stretch afterwards.', 'Hydration focus: under-eye care and extra moisture.', 'List three things you''re grateful for right now — be precise, not generic.'),
('glow_up', 18, 'HIIT-lite, 15 minutes (30s on, 30s off).', 'Full routine. Notice how automatic it''s becoming.', 'What would make this week, specifically, a win for you?'),
('glow_up', 19, 'Yoga or mobility, 20 minutes.', 'Gentle exfoliation, once this week.', 'What story about yourself are you ready to update or retire?'),
('glow_up', 20, '30-minute walk, phone on do-not-disturb.', 'Full routine, morning and night.', 'How do you want to feel by Day 30 — in one sentence?'),
('glow_up', 21, 'Strength circuit x3.', 'Full routine + your Day-21 progress photo.', 'Reflect on week three. What''s the moment you''re proudest of?'),
('glow_up', 22, 'Movement of choice, 25 minutes. It feels almost automatic now.', 'Your full routine.', 'Which habit from these three weeks do you want to keep forever?'),
('glow_up', 23, '20 minutes of cardio.', 'Treat yourself to a hydrating mask, once.', 'Where have you grown that you didn''t expect to?'),
('glow_up', 24, 'Strength session x3.', 'Full routine.', 'What fear has gotten smaller this month?'),
('glow_up', 25, 'Walk and dance combo, 30 minutes.', 'Full routine.', 'Write to the version of someone who needs to hear your story right now.'),
('glow_up', 26, 'Yoga or mobility, your choice.', 'Full routine, morning and night.', 'What does self-respect look like for you tomorrow morning?'),
('glow_up', 27, '25 minutes of movement you love.', 'Your full, complete routine.', 'List five wins — big or tiny — from this challenge so far.'),
('glow_up', 28, 'Strength circuit x3.', 'Full routine + your Day-28 progress photo.', 'The emotional one: look back at Day 1. How far have you actually come?'),
('glow_up', 29, 'Gentle movement, 20 minutes. Ease toward the finish.', 'Full routine.', 'What''s your Day-31 plan? How do you keep this going?'),
('glow_up', 30, 'Dance it out, or whatever movement you love most.', 'Full routine + your DAY 30 photo. Put it beside Day 1 and look.', 'You did it. Write down exactly what you''re keeping from these 30 days.'),
-- ---------------- PHONE DETOX (7 days) ----------------
('phone_detox', 1, 'Screenshot your current daily screen-time average and log it — your "before". Then set tomorrow''s rule: no phone for the first hour after you wake.', null, 'You can''t change what you won''t look at. That number is the wake-up call.'),
('phone_detox', 2, 'Hold the no-phone-first-hour rule. Delete the single app you lose the most time to.', null, 'The first hour sets the tone for the whole day. Take it back.'),
('phone_detox', 3, 'Switch your phone to grayscale for the day. Move your top three time-sink apps off the home screen.', null, 'Colour and convenience are the slot-machine. Remove them and the pull quietly dies.'),
('phone_detox', 4, 'No phone at meals today — all of them. Turn off notifications for every social app.', null, 'Presence is a muscle. Every meal is a rep.'),
('phone_detox', 5, 'Phone charges outside the bedroom tonight. Buy a cheap alarm clock if you need one.', null, 'The phone by your bed steals your last hour and your first. End that tonight.'),
('phone_detox', 6, 'One two-hour focus block with your phone in another room. Replace it with one real-world activity.', null, 'Boredom is where ideas come from. Sit in it on purpose today.'),
('phone_detox', 7, 'Screenshot your screen-time again and compare to Day 1. Set one permanent boundary you''ll actually keep.', null, 'Seven days. Look at the difference — and decide which rule stays for good.')
on conflict (challenge_type, day_number) do nothing;
