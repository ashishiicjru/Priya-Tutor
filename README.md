# Last Mile Tutor + Priya (linked suite)

Files: `index.html` (Last Mile Tutor: roadmap + teacher dashboard) · `priya.html` (Priya: tutor, mock tests, dashboard) · `shared.js` · `sw.js` (offline) · `api/ai.js` (backend).

## Deploy (Vercel, ~2 minutes)
1. Put this folder in a GitHub repo, import it in Vercel (no build step).
2. Project Settings → Environment Variables → add `ANTHROPIC_API_KEY`. Optional: `MODEL`, `RATE_PER_MIN`, `ALLOWED_ORIGIN`.
3. Redeploy. Open the site. The key exists only on the server; the HTML only calls `/api/ai`.
Local test: `npm i -g vercel && vercel dev`.

## How the two apps connect
- Shared language, name, mastery and test history (same browser storage).
- Roadmap topic → "Practice in Priya" builds a test on that topic. Priya → "Roadmap" prefills Last Mile with your weak topics.
- Learner shares a progress link from Priya → teacher pastes it in Last Mile → Teacher.
- Teacher generates a test link → learner opens it in Priya → result link goes back to the teacher.

If the backend is unreachable, Priya falls back to built-in lessons and fill-in-the-blank questions from the PDF text.
