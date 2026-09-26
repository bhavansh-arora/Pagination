# LaunchMint footage

Smooth screen footage of [launchmint.store](https://launchmint.store) for a voiceover video. There's no avatar, so there's nothing to lip-sync and nothing that looks AI-generated.

| File | Size | Length | Use it for |
|---|---|---|---|
| `launchmint-phone.mp4` | 1080×1920 (vertical) | 24.6s | Reels, Shorts, TikTok, Stories, WhatsApp status |
| `launchmint-desktop.mp4` | 1920×1080 | about 24s | YouTube, LinkedIn, your website |
| `clips/*.mp4` | 1080×1920 | 3–5s each | Cutting to your own voiceover timing |

The footage is recorded frame by frame, so the scrolling is perfectly smooth and the countdown timer ticks at real speed. The finger tap and the cursor are added for the video; they don't click anything on the real site.

## Voiceover script, timed to `launchmint-phone.mp4`

Read it slowly and smile while you talk; it comes through in your voice. Pauses are marked. Say the URL as "launch mint dot store".

| Time | On screen | Say |
|---|---|---|
| 0.0–2.6 | Headline and the price-rise timer | **"Hey! (beat) Ever wonder why people visit a website… but never buy?"** |
| 2.6–5.6 | The 3 steps and the first button | **"It's usually not the product. (beat) It's the page."** |
| 5.6–10.2 | Proof and member stories | **"This is launch mint dot store. A page we built to sell one digital product… (beat) and it's built around one idea: make buying easy."** |
| 10.2–14.0 | Scrolling to the price card | **"Real results up top. A timer that gives people a reason to act now…"** |
| 14.0–17.0 | ₹599 price card, the tap on the button | **"…one clear price. (beat) And checkout in one tap."** |
| 17.0–20.8 | 7-day money-back guarantee | **"Plus a guarantee, so saying yes feels safe."** |
| 20.8–24.6 | Closing line and button | **"If your site gets visitors but not sales, (beat) send me the link. I'll show you what's holding it back. Free."** |

About 20 seconds of talking over 24.6 seconds of video, which leaves room to breathe. If you speak slower, trim a line rather than rushing.

## Making the final video

1. **Record the voice on your phone.** Use a quiet room with soft furnishings, the phone about a hand's width from your mouth, and the Voice Memos or Recorder app. Do 2–3 takes and keep the most natural one, not the most perfect one.
2. **Optional, but it helps a lot:** film yourself saying just the first line ("Hey! Ever wonder why…") with your phone's front camera. Real faces make people stop scrolling. Use that for the first 2–3 seconds, then cut to the footage.
3. **Put it together** in CapCut, InShot or any editor:
   - Your face clip, if any, then `launchmint-phone.mp4` (or the clips in order).
   - Drop in your voice recording.
   - Turn on auto-captions. Most people watch without sound.
   - Add quiet background music at around 10–15% volume.
4. Export at 1080×1920.

## Re-recording

If the site changes, run it again:

```
pip install playwright imageio-ffmpeg
python -m playwright install chromium
python record.py phone      # or: desktop, clips
```

The camera path is the `PLANS` list at the top of `record.py`: where to pause, for how long, and where to tap.
