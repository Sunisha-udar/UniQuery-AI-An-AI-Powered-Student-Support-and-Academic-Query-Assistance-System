"""
Test script for Cloudinary integration
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.cloudinary_service import get_cloudinary_service
from app.config import get_settings
import tempfile


def test_cloudinary_config():
    """Test if Cloudinary credentials are configured"""
    print("=" * 60)
    print("Testing Cloudinary Configuration")
    print("=" * 60)
    
    settings = get_settings()
    
    if not settings.cloudinary_cloud_name:
        print("❌ CLOUDINARY_CLOUD_NAME not set in .env")
        print("\nPlease add your Cloudinary credentials to backend/.env:")
        print("CLOUDINARY_CLOUD_NAME=your_cloud_name")
        print("CLOUDINARY_API_KEY=your_api_key")
        print("CLOUDINARY_API_SECRET=your_api_secret")
        print("\nGet credentials from: https://console.cloudinary.com/")
        return False
    
    print(f"✅ Cloud Name: {settings.cloudinary_cloud_name}")
    print(f"✅ API Key: {settings.cloudinary_api_key[:8]}...")
    print(f"✅ API Secret: {'*' * 20}")
    return True


def test_cloudinary_upload():
    """Test uploading a sample PDF"""
    print("\n" + "=" * 60)
    print("Testing PDF Upload")
    print("=" * 60)
    
    # Create a test PDF
    try:
        from reportlab.pdfgen import canvas
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp_path = tmp.name
            
            # Create simple PDF
            c = canvas.Canvas(tmp_path)
            c.drawString(100, 750, "Cloudinary Test PDF")
            c.drawString(100, 700, "This is a test document for Cloudinary integration.")
            c.save()
        
        print(f"✅ Created test PDF: {tmp_path}")
        
        # Upload to Cloudinary
        cloudinary_service = get_cloudinary_service()
        
        metadata = {
            'title': 'Test Document',
            'category': 'test',
            'program': 'Test',
            'department': 'Test'
        }
        
        result = cloudinary_service.upload_pdf(tmp_path, 'test_doc_123', metadata)
        
        if result:
            print(f"✅ Upload successful!")
            print(f"   URL: {result['url']}")
            print(f"   Public ID: {result['public_id']}")
            print(f"   Size: {result.get('bytes', 'N/A')} bytes")
            print(f"   Format: {result.get('format', 'pdf')}")
            
            # Test getting URL
            print("\n" + "=" * 60)
            print("Testing Get PDF URL")
            print("=" * 60)
            
            url = cloudinary_service.get_pdf_url('test_doc_123')
            if url:
                print(f"✅ Retrieved URL: {url}")
            else:
                print("❌ Failed to retrieve URL")
            
            # Test deletion
            print("\n" + "=" * 60)
            print("Testing PDF Deletion")
            print("=" * 60)
            
            deleted = cloudinary_service.delete_pdf('test_doc_123')
            if deleted:
                print("✅ PDF deleted successfully")
            else:
                print("❌ Failed to delete PDF")
            
            return True
        else:
            print("❌ Upload failed")
            return False
            
    except ImportError:
        print("⚠️  reportlab not installed, skipping upload test")
        print("   Install with: pip install reportlab")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        # Clean up temp file
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def main():
    """Run all tests"""
    print("\n🧪 Cloudinary Integration Test\n")
    
    # Test 1: Configuration
    if not test_cloudinary_config():
        print("\n❌ Configuration test failed. Please set up Cloudinary credentials.")
        print("   See CLOUDINARY_SETUP.md for instructions.")
        return
    
    # Test 2: Upload/Download/Delete
    result = test_cloudinary_upload()
    
    if result is True:
        print("\n" + "=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
        print("\nCloudinary is ready to use!")
        print("You can now upload PDFs through the API.")
    elif result is False:
        print("\n" + "=" * 60)
        print("❌ Some tests failed")
        print("=" * 60)
        print("\nCheck your Cloudinary credentials and try again.")
    else:
        print("\n" + "=" * 60)
        print("⚠️  Tests skipped (missing dependencies)")
        print("=" * 60)


if __name__ == "__main__":
    main()
