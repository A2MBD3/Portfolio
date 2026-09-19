-- Seed data from existing portfolio
-- Default admin: username=admin  password=ChangeMe@2026
-- CHANGE PASSWORD IMMEDIATELY after first login!

INSERT INTO admin_users (username, password_hash) VALUES
('admin', 'MexDRt/sSnp0MEYMmwyIuQ==:fnJ7HvwnRio9gOl7oH+UeVEP8a3fYVFPh6huzkYJtrY=')
ON CONFLICT (username) DO NOTHING;

INSERT INTO site_settings (
  id, title, description, lang, footer_text,
  primary_color, secondary_color, accent_color, background_color, surface_color,
  font_family, glass_effect, glass_opacity, rain_effect, rain_drop_count,
  music_enabled, music_volume, music_shake, music_tracks,
  contact_form_enabled, contact_success_msg, contact_error_msg, contact_button_text
) VALUES (
  1,
  'আবদুল্লাহ আল মামুন',
  'আবদুল্লাহ আল মামুন - ওয়েব ডেভেলপার ও শিক্ষার্থী | বরিশাল, বাংলাদেশ',
  'bn',
  'কোডিং জানা না জানা কোন বিশেষ ব্যাপার নয়, আইডিয়াটাই আসল 😉',
  '#7c3aed', '#a855f7', '#c084fc', '#0a0015', '#1a0030',
  '''Hind Siliguri'', ''Poppins'', sans-serif',
  true, 0.03, true, 100,
  false, 0.25, true,
  '[]'::jsonb,
  true,
  'মেসেজ সফলভাবে পাঠানো হয়েছে!',
  'মেসেজ পাঠাতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
  'মেসেজ পাঠান'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO profile (
  id, name, profession, education, field, goal, passion, location, college, department, bio,
  email, address, freefire, profile_images, freefire_bg, profile_details, about_items, hobbies
) VALUES (
  1,
  'আবদুল্লাহ আল মামুন',
  'ওয়েব ডেভেলপার ও শিক্ষার্থী',
  'ইন্টারমিডিয়েট দ্বিতীয়বর্ষ',
  'বিজ্ঞান বিভাগ',
  'অজানা',
  'নতুন টেকনোলজি শেখা',
  'বরিশাল, বাংলাদেশ',
  'শহীদ স্মৃতি ডিগ্রী কলেজ',
  'বিজ্ঞান',
  'আমি আবদুল্লাহ আল মামুন, একজন শিক্ষার্থী। বিজ্ঞান বিভাগে পড়াশোনা করছি এবং ওয়েব ডেভেলপমেন্টে আমার গভীর আগ্রহ রয়েছে। আমি নতুন নতুন প্রযুক্তি শিখতে পছন্দ করি এবং ক্রিয়েটিভ কাজ করতে ভালোবাসি।',
  'aam.abdullah1@hotmail.com',
  'বরিশাল, বাংলাদেশ',
  '7236610758',
  '["assets/p.png"]'::jsonb,
  'assets/f.jpg',
  '[{"icon":"fa-graduation-cap","label":"ইন্টারমিডিয়েট পরীক্ষার্থী"},{"icon":"fa-map-marker-alt","label":"বরিশাল, বাংলাদেশ"}]'::jsonb,
  '[{"icon":"fa-book","text":"পড়াশোনা: উচ্চমাধ্যমিক"},{"icon":"fa-bullseye","text":"লক্ষ্য: অনির্ধারিত"},{"icon":"fa-heart","text":"প্যাশন: নতুন টেকনোলজি শেখা"},{"icon":"fa-building","text":"ডিপার্টমেন্ট: বিজ্ঞান"}]'::jsonb,
  '["ঘুম","ওয়েব ডিজাইন","কোডিং","ফ্রি ফায়ার","অ্যান্ড্রয়েড মডিফিকেশন","গান শোনা"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO skills (name, level, icon, category, sort_order) VALUES
('HTML', 80, 'fa-html5', 'tech', 1),
('CSS', 75, 'fa-css3-alt', 'tech', 2),
('JavaScript', 70, 'fa-js', 'tech', 3),
('Git', 60, 'fa-git-alt', 'tech', 4),
('Freefire', 100, 'fa-gamepad', 'hobby', 10),
('Java Game', 98, 'fa-gamepad', 'hobby', 11),
('Scarfall 2.0', 70, 'fa-gamepad', 'hobby', 12),
('PUBG', 50, 'fa-gamepad', 'hobby', 13)
ON CONFLICT DO NOTHING;

INSERT INTO projects (name, description, icon, link, sort_order, visible) VALUES
('Nebula Bypass', 'Advance bookmarklet for bypass multiple website ads', 'fa-compress', 'https://nebula-bot-8afg.onrender.com', 1, true),
('এনক্রিপশন ডিক্রিপশন টুল', 'আপনার টেক্সট সুরক্ষিতভাবে এনক্রিপ্ট এবং ডিক্রিপ্ট করুন base64 & AES', 'fa-shield', 'p/encrypt.html', 2, true),
('Saved Wifi Analyzer', 'View all saved wifi passwords on your rooted device. file wificonfigstore.xml', 'fa-wifi', 'p/wifi.html', 3, true),
('Hagu Agent', 'ফালতু একটা AI chatbot যা আপনি মাগনা ইউজ করতে পারেন কিন্তু এটা আপনার কাজে দেবে না', 'fa-comments', 'p/hagu.html', 4, true),
('Love ভাষা এনকোডার', 'এটা নিব্বা নিব্বীদের কাজে লাগবে আপনার না', 'fa-heart', 'p/l.html', 5, true),
('জীবন উন্নতির দিনলিপি', 'একটা রুটিন যা আপনার ফলো করা উচিত', 'fa-sticky-note', 'p/routine.html', 6, true),
('Tic Tac Toe গেম', 'হুদাই অনেক আগে বানাইছিলম', 'fa-gamepad', 'p/ttt.html', 7, true),
('device info', '', 'fa-mobile-alt', 'p/info.html', 8, true);

INSERT INTO social_links (name, url, icon, color, sort_order) VALUES
('GitHub', 'https://github.com/A2MBD3', 'fa-github', '#333333', 1),
('Facebook', 'https://www.facebook.com/a2mbd3', 'fa-facebook', '#1877f2', 2),
('Instagram', 'https://instagram.com/a2mbd3', 'fa-instagram', '#e4405f', 3),
('Telegram', 'https://t.me/a2mbd3', 'fa-telegram', '#0088cc', 4);

INSERT INTO navigation (label, icon, section, sort_order) VALUES
('হোম', 'fa-home', 'home', 1),
('যোগাযোগ', 'fa-address-book', 'contact', 2),
('প্রজেক্ট', 'fa-code', 'projects', 3);
