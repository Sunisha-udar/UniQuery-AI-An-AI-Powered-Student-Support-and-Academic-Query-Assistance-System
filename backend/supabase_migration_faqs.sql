-- Migration: Create FAQs table
-- This table stores frequently asked questions with answers

CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    program TEXT DEFAULT 'All',
    department TEXT DEFAULT 'All',
    semester INTEGER DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    
    -- Ensure question is unique within the same category/program/department/semester
    CONSTRAINT unique_faq UNIQUE (question, category, program, department, semester)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_program ON faqs(program);
CREATE INDEX IF NOT EXISTS idx_faqs_department ON faqs(department);
CREATE INDEX IF NOT EXISTS idx_faqs_semester ON faqs(semester);
CREATE INDEX IF NOT EXISTS idx_faqs_view_count ON faqs(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_faqs_is_pinned ON faqs(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_faqs_created_at ON faqs(created_at DESC);

-- Full-text search index on question and answer
CREATE INDEX IF NOT EXISTS idx_faqs_search ON faqs USING gin(to_tsvector('english', question || ' ' || answer));

-- Add comments for documentation
COMMENT ON TABLE faqs IS 'Stores frequently asked questions with answers for quick student access';
COMMENT ON COLUMN faqs.id IS 'Unique identifier for the FAQ';
COMMENT ON COLUMN faqs.question IS 'The question text';
COMMENT ON COLUMN faqs.answer IS 'The answer text (supports markdown)';
COMMENT ON COLUMN faqs.category IS 'Category (e.g., Admissions, Exams, Attendance, Fees, etc.)';
COMMENT ON COLUMN faqs.program IS 'Academic program (e.g., B.Tech, M.Tech, or All)';
COMMENT ON COLUMN faqs.department IS 'Department (e.g., CSE, ECE, or All)';
COMMENT ON COLUMN faqs.semester IS 'Semester number (0 for all semesters)';
COMMENT ON COLUMN faqs.view_count IS 'Number of times this FAQ has been viewed';
COMMENT ON COLUMN faqs.is_pinned IS 'Whether this FAQ should appear at the top';
COMMENT ON COLUMN faqs.created_at IS 'Timestamp when the FAQ was created';
COMMENT ON COLUMN faqs.updated_at IS 'Timestamp when the FAQ was last updated';

-- Insert some sample FAQs
INSERT INTO faqs (question, answer, category, program, department, semester, is_pinned) VALUES
('What is the attendance policy?', 'Students must maintain a minimum of 75% attendance in each course to be eligible for end-semester examinations. Medical certificates can be submitted for approved absences.', 'Attendance', 'All', 'All', 0, true),
('How do I check my exam schedule?', 'Exam schedules are published on the university portal 2 weeks before the examination period. You can also check the Academic Calendar section in your student dashboard.', 'Exams', 'All', 'All', 0, true),
('What are the library timings?', 'The central library is open from 8:00 AM to 10:00 PM on weekdays and 9:00 AM to 6:00 PM on weekends. Extended hours are available during examination periods.', 'Facilities', 'All', 'All', 0, false),
('How can I apply for a scholarship?', 'Scholarship applications are available on the university portal under the Financial Aid section. The deadline is typically 30 days after the start of each semester.', 'Fees', 'All', 'All', 0, false),
('What is the process for course registration?', 'Course registration opens at the beginning of each semester. Log in to the student portal, navigate to Course Registration, and select your courses based on your curriculum requirements.', 'Academics', 'All', 'All', 0, true);
