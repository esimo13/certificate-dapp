-- Seed data for transfer calculator: BRAC University -> University of Adelaide
-- Prerequisite: universities, courses, equivalencies tables already created.

INSERT INTO universities (name, country, annual_load_units)
VALUES
  ('BRAC University', 'Bangladesh', 36),
  ('University of Adelaide', 'Australia', 24)
ON CONFLICT (name) DO UPDATE SET
  country = EXCLUDED.country,
  annual_load_units = EXCLUDED.annual_load_units;

INSERT INTO courses (uni_id, course_code, title, credits, syllabus_text)
SELECT u.id, v.course_code, v.title, v.credits, v.syllabus_text
FROM universities u
JOIN (
  VALUES
    ('BRAC University', 'CSE110', 'Programming I', 3, 'Intro to programming, variables, loops, functions, arrays.'),
    ('BRAC University', 'CSE220', 'Data Structures', 3, 'Stacks, queues, linked lists, trees, hashing, recursion.'),
    ('BRAC University', 'CSE221', 'Algorithms', 3, 'Sorting, searching, graph algorithms, complexity analysis.'),
    ('University of Adelaide', 'COMP1002', 'Problem Solving', 3, 'Problem decomposition, programming fundamentals, recursion, data representation.'),
    ('University of Adelaide', 'COMP2017', 'Data Structures & Alg', 3, 'Linked lists, trees, hash maps, recursion, algorithms and complexity.')
) AS v(university_name, course_code, title, credits, syllabus_text)
  ON u.name = v.university_name
ON CONFLICT (uni_id, course_code) DO UPDATE SET
  title = EXCLUDED.title,
  credits = EXCLUDED.credits,
  syllabus_text = EXCLUDED.syllabus_text;

INSERT INTO equivalencies (source_course_id, target_course_id, match_confidence_score)
SELECT sc.id, tc.id, v.score
FROM (
  VALUES
    ('CSE110', 'COMP1002', 89),
    ('CSE220', 'COMP2017', 93),
    ('CSE221', 'COMP2017', 86)
) AS v(source_code, target_code, score)
JOIN courses sc ON sc.course_code = v.source_code
JOIN courses tc ON tc.course_code = v.target_code
JOIN universities su ON su.id = sc.uni_id AND su.name = 'BRAC University'
JOIN universities tu ON tu.id = tc.uni_id AND tu.name = 'University of Adelaide'
ON CONFLICT (source_course_id, target_course_id) DO UPDATE SET
  match_confidence_score = EXCLUDED.match_confidence_score;
