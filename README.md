# Smart Live TV — Web Admin Panel

A static admin panel for managing the Smart Live TV Supabase catalogue. Designed for free static hosting such as GitHub Pages.

## Important security notes
- `config.js` must contain only the Supabase Project URL and the **Publishable key** (legacy `anon` key is also acceptable).
- Never put the `service_role` key, secret key, database password, or personal credentials in this repository.
- Database Row Level Security (RLS) must remain enabled. The app relies on the `app_admins` table and `is_smart_live_tv_admin()` policy function created in the Supabase SQL setup.
- Only add streams you own or are authorized to distribute. Some streams may be blocked by DRM, geography, CORS, or device limitations.

## Setup
1. In Supabase Dashboard, open Project Settings → API (or API Keys).
2. Copy the Project URL and the **Publishable key**. Do not copy a Secret key.
3. Open `config.js` and replace:
   - `PASTE_YOUR_SUPABASE_PROJECT_URL_HERE`
   - `PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE`
4. Commit the files to the GitHub repository.
5. In GitHub, open Settings → Pages.
6. Under Build and deployment, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
7. Wait for GitHub Pages to publish. The URL will appear in Settings → Pages.

## First login
Use the email and password of the Supabase Auth user that you added to `public.app_admins`.

## Files
- `index.html` — page structure
- `style.css` — responsive dark UI
- `config.js` — public Supabase configuration placeholders
- `app.js` — login and channel/country/category management

## Database tables expected
`countries`, `categories`, `channels`, `app_admins`.

This is an initial admin panel. It does not host video streams; it stores channel metadata and authorized stream URLs.


## Playback type update
The channel form stores one of four playback types in `channels.playback_type`:
- `hls` — direct HLS `.m3u8` URL
- `dash` — direct DASH `.mpd` URL
- `youtube` — public YouTube video/live URL for an authorized YouTube Player
- `web` — official website/player URL for a WebView-style player

Before deploying, run `SmartLiveTV_PlaybackType_Supabase.sql` once in Supabase SQL Editor. Existing channels are preserved and default to `hls`.

This updates only the Admin Panel and database metadata. The Android app still needs corresponding player logic for YouTube and Web Player types. A YouTube watch URL is not a direct HLS/DASH stream.
