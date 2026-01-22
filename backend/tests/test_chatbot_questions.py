from app.services.qdrant_service import get_qdrant_service

questions = [
    # Direct facts
    "What is the attendance requirement for competitive coding sessions?",
    "What is the minimum pass percentage for the external examination?",
    "Is regular participation important for competitive coding?",
    
    # Paraphrased
    "How much attendance do I need for competitive coding?",
    "What percentage do I need to pass the exam?",
    "Can I skip competitive coding sessions?",
    
    # Should not find
    "What are the timings for competitive coding sessions?",
    "Who is the instructor for competitive coding?",
    
    # Edge cases
    "Tell me about competitive coding",
    "Attendance requirements",
]

qdrant = get_qdrant_service()

for i, q in enumerate(questions, 1):
    print(f"\n{'='*70}")
    print(f"Q{i}: {q}")
    print('='*70)
    
    results = qdrant.search(query=q, limit=1)
    
    if results:
        r = results[0]
        print(f"Score: {r['score']:.4f}")
        print(f"Answer: {r.get('text')}")
        
        if r['score'] < 0.5:
            print("⚠️  LOW CONFIDENCE - May not be relevant")
    else:
        print("❌ No results found")
