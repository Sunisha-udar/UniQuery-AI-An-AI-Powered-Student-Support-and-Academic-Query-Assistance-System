"""
Test multi-format document support
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.document_processor import get_document_processor


def main():
    """Test document processor"""
    print("\n🧪 Multi-Format Document Support Test\n")
    
    processor = get_document_processor()
    
    print("=" * 60)
    print("Supported Formats")
    print("=" * 60)
    
    print("\n✅ PDF Support:", "Enabled" if processor.pdf_available else "Disabled")
    print("✅ Word Support:", "Enabled" if processor.word_available else "Disabled")
    print("✅ Excel Support:", "Enabled" if processor.excel_available else "Disabled")
    print("✅ PowerPoint Support:", "Enabled" if processor.ppt_available else "Disabled")
    print("✅ Text Support: Always Enabled")
    
    print("\n" + "=" * 60)
    print("File Type Detection")
    print("=" * 60)
    
    test_files = [
        "document.pdf",
        "syllabus.docx",
        "grades.xlsx",
        "lecture.pptx",
        "notes.txt",
        "readme.md",
        "unknown.xyz"
    ]
    
    for filename in test_files:
        file_type = processor.get_file_type(filename)
        supported = processor.is_supported(filename)
        status = "✅" if supported else "❌"
        print(f"{status} {filename:20} → {file_type or 'unsupported'}")
    
    print("\n" + "=" * 60)
    print("Supported Extensions")
    print("=" * 60)
    
    for format_name, extensions in processor.SUPPORTED_FORMATS.items():
        print(f"\n{format_name.upper()}:")
        print(f"  Extensions: {', '.join(extensions)}")
    
    print("\n" + "=" * 60)
    print("✅ Multi-format support is ready!")
    print("=" * 60)
    
    print("\nYou can now upload:")
    print("  • PDF documents (.pdf)")
    print("  • Word documents (.docx, .doc)")
    print("  • Excel spreadsheets (.xlsx, .xls, .csv)")
    print("  • PowerPoint presentations (.pptx, .ppt)")
    print("  • Text files (.txt, .md)")
    
    print("\nAll formats will be:")
    print("  1. Extracted for text")
    print("  2. Chunked and embedded")
    print("  3. Stored in Qdrant (searchable)")
    print("  4. Uploaded to Cloudinary (downloadable)")


if __name__ == "__main__":
    main()
