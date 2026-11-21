# Smart Live TV Admin Panel — আপলোড নির্দেশিকা

## ১) ZIP খুলুন
ZIP ফাইলটি Extract করুন। ভেতরে `index.html`, `style.css`, `config.js`, `app.js`, `README.md` পাবেন।

## ২) Supabase URL ও Publishable Key বসান
Supabase Dashboard → Project Settings → API / API Keys খুলুন।
- Project URL কপি করুন।
- Publishable key কপি করুন (পুরোনো প্রকল্পে `anon` public key লেখা থাকতে পারে)।
- Secret বা service_role key কখনো ব্যবহার করবেন না।

`config.js` ফাইল Notepad-এ খুলে দুইটি placeholder বদলে Save করুন।

## ৩) GitHub-এ ফাইল আপলোড
Repository `smart-live-tv-admin` খুলুন।
- Add file → Upload files
- ZIP Extract করা ফোল্ডারের ভেতরের ফাইলগুলো নির্বাচন করুন (ফোল্ডার নিজে নয়)
- Commit changes চাপুন।

## ৪) GitHub Pages চালু
Repository → Settings → Pages
- Source: Deploy from a branch
- Branch: main
- Folder: / (root)
- Save

## ৫) লগইন
Pages URL খুলে Supabase Auth-এ তৈরি করা Admin email/password দিয়ে লগইন করুন।
