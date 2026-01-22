"""
Test Groq LLM integration
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.groq_service import get_groq_service
from app.config import get_settings


def test_groq_config():
    """Test Groq configuration"""
    print("=" * 60)
    print("Testing Groq Configuration")
    print("=" * 60)
    
    settings = get_settings()
    
    if not settings.groq_api_key:
        print("❌ GROQ_API_KEY not set in .env")
        print("\nGet your API key from: https://console.groq.com/")
        return False
    
    print(f"✅ API Key: {settings.groq_api_key[:10]}...")
    print(f"✅ Model: {settings.groq_model}")
    return True


def test_groq_generation():
    """Test answer generation"""
    print("\n" + "=" * 60)
    print("Testing Answer Generation")
    print("=" * 60)
    
    groq_service = get_groq_service()
    
    # Mock context chunks
    context_chunks = [
        {
            'title': 'CSE Syllabus 2024',
            'page': 5,
            'text': 'Data Structures is a core course in semester 3. Topics include arrays, linked lists, stacks, queues, trees, and graphs. Prerequisites: Programming fundamentals.'
        },
        {
            'title': 'CSE Syllabus 2024',
            'page': 6,
            'text': 'The course uses C++ as the primary language. Lab sessions are mandatory. Assessment includes 2 midterms (30%), final exam (40%), and lab work (30%).'
        }
    ]
    
    question = "What topics are covered in Data Structures?"
    
    print(f"\nQuestion: {question}")
    print("\nGenerating answer...")
    
    answer = groq_service.generate_answer(question, context_chunks)
    
    if answer:
        print(f"\n✅ Answer generated:\n")
        print("-" * 60)
        print(answer)
        print("-" * 60)
        return True
    else:
        print("❌ Failed to generate answer")
        return False


def main():
    """Run all tests"""
    print("\n🧪 Groq LLM Integration Test\n")
    
    if not test_groq_config():
        print("\n❌ Configuration test failed")
        return
    
    if test_groq_generation():
        print("\n" + "=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
        print("\nGroq is ready to use!")
        print("\nNext steps:")
        print("1. Upload a document via API")
        print("2. Query the system")
        print("3. Get AI-powered answers!")
    else:
        print("\n❌ Generation test failed")


if __name__ == "__main__":
    main()
