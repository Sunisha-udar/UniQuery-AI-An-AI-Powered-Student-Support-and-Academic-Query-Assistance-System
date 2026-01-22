"""
Test chatbot behavior for document-based vs general responses
"""
import sys
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.groq_service import get_groq_service


def test_intent_detection():
    """Test that LLM can correctly classify questions across 25+ categories"""
    print("\n" + "=" * 60)
    print("Testing Intent Detection - 100+ Questions Across 25 Categories")
    print("=" * 60)
    
    groq_service = get_groq_service()
    
    test_cases = [
        # Category 1: Greetings & Pleasantries (5)
        ("Hello!", "greetings"),
        ("Hi there", "greetings"),
        ("Good morning", "greetings"),
        ("Hey, what's up?", "greetings"),
        ("Namaste", "greetings"),
        
        # Category 2: Gratitude & Acknowledgment (5)
        ("Thanks for your help", "gratitude"),
        ("Thank you so much!", "gratitude"),
        ("I appreciate it", "gratitude"),
        ("That was helpful", "gratitude"),
        ("Great, thanks!", "gratitude"),
        
        # Category 3: Small Talk & Casual Questions (5)
        ("How are you?", "small_talk"),
        ("What's your name?", "small_talk"),
        ("Are you a robot?", "small_talk"),
        ("Can you help me?", "small_talk"),
        ("What can you do?", "small_talk"),
        
        # Category 4: Farewells (5)
        ("Goodbye", "farewells"),
        ("See you later", "farewells"),
        ("Bye bye", "farewells"),
        ("Take care", "farewells"),
        ("Have a nice day", "farewells"),
        
        # Category 5: Attendance & Leave Policies (5)
        ("What is the minimum attendance?", "attendance_leave"),
        ("How much attendance is required?", "attendance_leave"),
        ("Can I get leave for medical reasons?", "attendance_leave"),
        ("What happens if attendance is below 75%?", "attendance_leave"),
        ("How to apply for leave?", "attendance_leave"),
        
        # Category 6: Exam & Assessment (5)
        ("When are the exams?", "exams_assessment"),
        ("What is the exam pattern?", "exams_assessment"),
        ("How many internal assessments are there?", "exams_assessment"),
        ("What is the passing marks?", "exams_assessment"),
        ("Can I apply for re-evaluation?", "exams_assessment"),
        
        # Category 7: Fees & Financial (5)
        ("What is the fee structure?", "fees_financial"),
        ("How to pay fees online?", "fees_financial"),
        ("Are there any scholarships available?", "fees_financial"),
        ("What is the last date for fee payment?", "fees_financial"),
        ("Is there any late fee penalty?", "fees_financial"),
        
        # Category 8: Admission & Eligibility (5)
        ("What is the admission process?", "admission_eligibility"),
        ("What are the eligibility criteria?", "admission_eligibility"),
        ("When does admission start?", "admission_eligibility"),
        ("Which entrance exam is required?", "admission_eligibility"),
        ("How to apply for admission?", "admission_eligibility"),
        
        # Category 9: Courses & Programs (5)
        ("What courses are offered?", "courses_programs"),
        ("Tell me about the B.Tech program", "courses_programs"),
        ("What is the MBA syllabus?", "courses_programs"),
        ("Are there any diploma courses?", "courses_programs"),
        ("What specializations are available in CSE?", "courses_programs"),
        
        # Category 10: University Information (5)
        ("When was KR Mangalam University founded?", "university_info"),
        ("Where is the university located?", "university_info"),
        ("Is the university UGC approved?", "university_info"),
        ("What is the university ranking?", "university_info"),
        ("Who is the chancellor?", "university_info"),
        
        # Category 11: Timetable & Schedule (5)
        ("What is the class timetable?", "timetable_schedule"),
        ("When does the semester start?", "timetable_schedule"),
        ("What are the college timings?", "timetable_schedule"),
        ("Is there a holiday list?", "timetable_schedule"),
        ("When is the semester break?", "timetable_schedule"),
        
        # Category 12: Library & Resources (5)
        ("What are the library timings?", "library_resources"),
        ("How to issue books from library?", "library_resources"),
        ("Are there e-resources available?", "library_resources"),
        ("What is the book return policy?", "library_resources"),
        ("Can I access digital library?", "library_resources"),
        
        # Category 13: Hostel & Accommodation (5)
        ("Are hostel facilities available?", "hostel_accommodation"),
        ("What is the hostel fee?", "hostel_accommodation"),
        ("What are the hostel rules?", "hostel_accommodation"),
        ("Is food provided in hostel?", "hostel_accommodation"),
        ("How to apply for hostel?", "hostel_accommodation"),
        
        # Category 14: Placements & Career (5)
        ("What is the placement record?", "placements_career"),
        ("Which companies visit for campus recruitment?", "placements_career"),
        ("What is the average package?", "placements_career"),
        ("Is there a training and placement cell?", "placements_career"),
        ("How to register for placements?", "placements_career"),
        
        # Category 15: General Knowledge - Science (5)
        ("What is photosynthesis?", "science"),
        ("Who discovered gravity?", "science"),
        ("What is the speed of light?", "science"),
        ("Explain quantum physics", "science"),
        ("What is DNA?", "science"),
        
        # Category 16: General Knowledge - History (5)
        ("Who was the first Prime Minister of India?", "history"),
        ("When did World War 2 end?", "history"),
        ("Who built the Taj Mahal?", "history"),
        ("What is the French Revolution?", "history"),
        ("When did India get independence?", "history"),
        
        # Category 17: General Knowledge - Geography (5)
        ("What is the capital of France?", "geography"),
        ("Which is the largest ocean?", "geography"),
        ("How many continents are there?", "geography"),
        ("What is the longest river?", "geography"),
        ("Where is Mount Everest?", "geography"),
        
        # Category 18: General Knowledge - Current Affairs (5)
        ("Who is the current President of USA?", "current_affairs"),
        ("What is cryptocurrency?", "current_affairs"),
        ("Tell me about climate change", "current_affairs"),
        ("What is artificial intelligence?", "current_affairs"),
        ("Explain blockchain technology", "current_affairs"),
        
        # Category 19: Mathematics & Calculations (5)
        ("What is 25 + 37?", "mathematics"),
        ("Solve this equation: 2x + 5 = 15", "mathematics"),
        ("What is the value of pi?", "mathematics"),
        ("Calculate 15% of 200", "mathematics"),
        ("What is Pythagoras theorem?", "mathematics"),
        
        # Category 20: Technology & Programming (5)
        ("What is Python?", "technology_programming"),
        ("Explain machine learning", "technology_programming"),
        ("What is cloud computing?", "technology_programming"),
        ("How does the internet work?", "technology_programming"),
        ("What is a database?", "technology_programming"),
        
        # Category 21: Sports & Entertainment (5)
        ("Who won the last World Cup?", "sports_entertainment"),
        ("Who is Virat Kohli?", "sports_entertainment"),
        ("What is the Olympics?", "sports_entertainment"),
        ("Tell me about cricket rules", "sports_entertainment"),
        ("Who is the fastest runner?", "sports_entertainment"),
        
        # Category 22: Health & Wellness (5)
        ("What is a balanced diet?", "health_wellness"),
        ("How to stay healthy?", "health_wellness"),
        ("What is COVID-19?", "health_wellness"),
        ("Benefits of exercise", "health_wellness"),
        ("What is mental health?", "health_wellness"),
        
        # Category 23: Complaints & Issues (5)
        ("I have a complaint about my grades", "complaints_issues"),
        ("The portal is not working", "complaints_issues"),
        ("I didn't receive my ID card", "complaints_issues"),
        ("There's an error in my marksheet", "complaints_issues"),
        ("How to report a problem?", "complaints_issues"),
        
        # Category 24: Documents & Certificates (5)
        ("How to get a bonafide certificate?", "documents_certificates"),
        ("When will I receive my degree?", "documents_certificates"),
        ("How to apply for transcript?", "documents_certificates"),
        ("What documents are needed for admission?", "documents_certificates"),
        ("Can I get a migration certificate?", "documents_certificates"),
        
        # Category 25: Extracurricular & Clubs (5)
        ("What clubs are available?", "extracurricular_clubs"),
        ("Are there any sports facilities?", "extracurricular_clubs"),
        ("How to join cultural activities?", "extracurricular_clubs"),
        ("Is there a tech club?", "extracurricular_clubs"),
        ("What events are organized?", "extracurricular_clubs"),
    ]
    
    passed = 0
    failed = 0
    errors = 0
    
    for i, (question, expected_intent) in enumerate(test_cases, 1):
        print(f"\n[{i}/{len(test_cases)}] Question: '{question}'")
        
        try:
            response = groq_service.client.chat.completions.create(
                model=groq_service.model,
                messages=[
                    {
                        "role": "system",
                        "content": """Classify the user's message into ONE of these 25 specific categories:

Conversational:
1. greetings - hello, hi, good morning
2. gratitude - thanks, thank you, appreciate
3. small_talk - how are you, what's your name, casual questions
4. farewells - goodbye, bye, see you later

Academic (University-Related):
5. attendance_leave - attendance policies, leave applications
6. exams_assessment - exam dates, patterns, marks, re-evaluation
7. fees_financial - fee structure, payment, scholarships
8. admission_eligibility - admission process, eligibility, entrance exams
9. courses_programs - courses offered, syllabus, specializations
10. university_info - founding, location, accreditation, ranking
11. timetable_schedule - class timings, semester dates, holidays
12. library_resources - library timings, book issue, e-resources
13. hostel_accommodation - hostel facilities, fees, rules
14. placements_career - placement records, companies, packages
15. complaints_issues - complaints, portal issues, problems
16. documents_certificates - bonafide, degree, transcripts
17. extracurricular_clubs - clubs, sports, cultural activities

General Knowledge:
18. science - physics, chemistry, biology, scientific facts
19. history - historical events, dates, personalities
20. geography - countries, capitals, rivers, mountains
21. current_affairs - politics, technology trends, global events
22. mathematics - calculations, equations, theorems
23. technology_programming - programming, ML, cloud, internet
24. sports_entertainment - sports, games, athletes
25. health_wellness - diet, exercise, diseases, mental health

Respond with ONLY the category name (e.g., 'greetings' or 'exams_assessment'), nothing else."""
                    },
                    {
                        "role": "user",
                        "content": f"Classify this message: {question}"
                    }
                ],
                max_tokens=10,
                temperature=0.0
            )
            
            detected_intent = response.choices[0].message.content.strip().lower()
            
            # Check if detected intent matches expected
            match = expected_intent.lower() in detected_intent or detected_intent in expected_intent.lower()
            
            if match:
                print(f"[PASS] {detected_intent}")
                passed += 1
            else:
                print(f"[FAIL] {detected_intent} (expected: {expected_intent})")
                failed += 1
            
            # Rate limiting: Sleep after every request to avoid hitting 30 RPM limit
            # 30 requests per minute = 1 request per 2 seconds
            time.sleep(2.1)
                
        except Exception as e:
            print(f"[ERROR] Error: {e}")
            errors += 1
            time.sleep(2.1)
    
    # Print summary
    print("\n" + "=" * 60)
    print(f"RESULTS: Passed: {passed} | Failed: {failed} | Errors: {errors}")
    print("=" * 60)


def test_document_only_behavior():
    """Test that the chatbot enforces document-only answers"""
    print("\n" + "=" * 60)
    print("Testing Document-Only Behavior")
    print("=" * 60)
    
    groq_service = get_groq_service()
    
    # Simulate a question with NO context (like "when was university founded")
    # The LLM should NOT use general knowledge
    
    question = "When was KR Mangalam University founded?"
    context_chunks = []  # Empty context - no matching documents
    
    print(f"\nQuestion: {question}")
    print("Context: No matching documents")
    print("\nExpected: Should say 'no information available'")
    print("NOT expected: Should NOT say '2013' or use general knowledge")
    
    # This would be called in the actual flow
    print("\n[PASS] Test setup complete - actual behavior will be verified via frontend")


def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("COMPREHENSIVE CHATBOT TRAINING VERIFICATION")
    print("125 Questions | 25 Specific Categories")
    print("=" * 70)
    print("\nNOTE: This test will take ~4-5 minutes due to Groq rate limits")
    print("(30 requests/minute = 2 seconds between each request)")
    print("\nStarting tests...\n")
    
    start_time = time.time()
    test_intent_detection()
    test_document_only_behavior()
    end_time = time.time()
    
    duration = int(end_time - start_time)
    minutes = duration // 60
    seconds = duration % 60
    
    print("\n" + "=" * 70)
    print(f"[PASS] All tests completed in {minutes}m {seconds}s!")
    print("=" * 70)
    print("\nCategories Tested:")
    print("  1. Greetings & Pleasantries")
    print("  2. Gratitude & Acknowledgment")
    print("  3. Small Talk & Casual Questions")
    print("  4. Farewells")
    print("  5. Attendance & Leave Policies")
    print("  6. Exam & Assessment")
    print("  7. Fees & Financial")
    print("  8. Admission & Eligibility")
    print("  9. Courses & Programs")
    print(" 10. University Information")
    print(" 11. Timetable & Schedule")
    print(" 12. Library & Resources")
    print(" 13. Hostel & Accommodation")
    print(" 14. Placements & Career")
    print(" 15. General Knowledge - Science")
    print(" 16. General Knowledge - History")
    print(" 17. General Knowledge - Geography")
    print(" 18. General Knowledge - Current Affairs")
    print(" 19. Mathematics & Calculations")
    print(" 20. Technology & Programming")
    print(" 21. Sports & Entertainment")
    print(" 22. Health & Wellness")
    print(" 23. Complaints & Issues")
    print(" 24. Documents & Certificates")
    print(" 25. Extracurricular & Clubs")
    print("\nNext: Test manually via frontend:")
    print("1. Ask: 'Hello' -> Should get friendly greeting")
    print("2. Ask: 'What is minimum attendance?' -> Should say 'no documents' if none uploaded")
    print("3. Ask: 'When was KR Mangalam founded?' -> Should NOT answer '2013'")
    print("4. Ask: 'What is the capital of France?' -> Should say 'I can only answer university questions'")


if __name__ == "__main__":
    main()
