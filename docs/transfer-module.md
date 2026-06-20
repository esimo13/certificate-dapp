# Credit Transfer Calculator Module

## Implemented scope

- Supabase schema for transfer workflow:
  - `universities(id, name, country, annual_load_units)`
  - `courses(id, uni_id, course_code, title, credits, syllabus_text)`
  - `equivalencies(id, source_course_id, target_course_id, match_confidence_score)`
- Quantitative transfer formula:

  Target Units = (Source Course Credits / Source Annual Load) * Target Annual Load

- Backend APIs:
  - `GET /api/transfer/universities`
  - `GET /api/transfer/courses?uniId=<uuid>`
  - `POST /api/transfer/calculate`
  - `POST /api/transfer/syllabus-compare`
- Frontend multi-step page: `/transfer`
  - Step 1: source + target university selection
  - Step 2: source completed course selection
  - Step 3: estimated transferable units + mapped target course suggestions
  - Per-course `Syllabus Comparison` button
- Supabase Edge Function with OpenAI:
  - `supabase/functions/syllabus-comparison/index.ts`
  - Input: `syllabusA`, `syllabusB`
  - Output: `{ match_percentage, reasoning }`

## Seed data included

- BRAC University annual load = 36
- University of Adelaide annual load = 24
- BRAC courses:
  - CSE110 (Programming I)
  - CSE220 (Data Structures)
  - CSE221 (Algorithms)
- Adelaide courses:
  - COMP1002 (Problem Solving)
  - COMP2017 (Data Structures & Alg)

## Edge function deployment

1. Install Supabase CLI and log in.
2. Set function secrets in your Supabase project:
   - `OPENAI_API_KEY`
   - Optional: `OPENAI_MODEL` (default `gpt-4o`)
3. Deploy:

```bash
supabase functions deploy syllabus-comparison
```

4. Ensure backend env includes:
   - `SUPABASE_FUNCTIONS_URL=https://<project-ref>.supabase.co/functions/v1`
   - `SUPABASE_ANON_KEY=<anon-key>`

## SQL execution order

1. Run schema SQL (`database/schema.sql`) if setting up from scratch.
2. Run migration SQL (`database/migration.sql`) for existing DBs and seed rows.
3. Optional isolated seed-only snippet:
   - `docs/database/seed_transfer.sql`
