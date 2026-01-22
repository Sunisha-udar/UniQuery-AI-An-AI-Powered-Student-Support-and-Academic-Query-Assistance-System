"""
Test PDF upload functionality
Creates a simple test PDF and uploads it
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import requests
import os

def create_test_pdf(filename="test_document.pdf"):
    """Create a simple test PDF"""
    c = canvas.Canvas(filename, pagesize=letter)
    
    # Page 1
    c.drawString(100, 750, "Test Academic Document")
    c.drawString(100, 730, "B.Tech CSE - Semester 3")
    c.drawString(100, 700, "")
    c.drawString(100, 680, "Attendance Policy:")
    c.drawString(100, 660, "Students must maintain a minimum of 75% attendance in all courses.")
    c.drawString(100, 640, "Attendance below 75% will result in debarment from examinations.")
    c.drawString(100, 620, "Medical leave requires proper documentation.")
    c.showPage()
    
    # Page 2
    c.drawString(100, 750, "Course Structure:")
    c.drawString(100, 730, "")
    c.drawString(100, 710, "1. Python Programming (CS301) - 4 credits")
    c.drawString(100, 690, "2. Data Structures (CS302) - 4 credits")
    c.drawString(100, 670, "3. Database Management (CS303) - 3 credits")
    c.drawString(100, 650, "4. Operating Systems (CS304) - 3 credits")
    c.showPage()
    
    c.save()
    print(f"✓ Created test PDF: {filename}")
    return filename

def upload_pdf(filename):
    """Upload PDF to the backend"""
    url = "http://127.0.0.1:8000/documents/upload"
    
    with open(filename, 'rb') as f:
        files = {'file': (filename, f, 'application/pdf')}
        data = {
            'title': 'Test Academic Document',
            'category': 'syllabus',
            'program': 'B.Tech',
            'department': 'CSE',
            'semester': 3
        }
        
        print(f"\n⏳ Uploading {filename}...")
        response = requests.post(url, files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Upload successful!")
            print(f"  - Document ID: {result['document']['id']}")
            print(f"  - Chunks created: {result['document']['chunk_count']}")
            print(f"  - Message: {result['message']}")
            return True
        else:
            print(f"✗ Upload failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return False

if __name__ == "__main__":
    print("=" * 60)
    print("PDF Upload Test")
    print("=" * 60)
    
    # Check if reportlab is installed
    try:
        from reportlab.pdfgen import canvas
    except ImportError:
        print("\n⚠ reportlab not installed. Installing...")
        os.system("pip install reportlab")
        from reportlab.pdfgen import canvas
    
    # Create test PDF
    pdf_file = create_test_pdf()
    
    # Upload it
    success = upload_pdf(pdf_file)
    
    # Cleanup
    if os.path.exists(pdf_file):
        os.remove(pdf_file)
        print(f"\n✓ Cleaned up test file")
    
    if success:
        print("\n" + "=" * 60)
        print("✓ Test passed! PDF processing is working.")
        print("=" * 60)
        print("\nNext: Test search with:")
        print("  python manage_qdrant.py search \"attendance requirement\"")
    else:
        print("\n" + "=" * 60)
        print("✗ Test failed. Check the error above.")
        print("=" * 60)
