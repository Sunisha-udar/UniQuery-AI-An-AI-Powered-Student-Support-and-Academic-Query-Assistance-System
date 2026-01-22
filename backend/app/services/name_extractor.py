"""
Document Name Extraction Service
Automatically extracts structured document names from PDF content
"""

import PyPDF2
import re
from typing import Optional

class DocumentNameExtractor:
    """Extract structured document names from PDF content"""
    
    def extract_pdf_text(self, pdf_path: str, max_pages: int = 3) -> str:
        """Extract text from first few pages of PDF"""
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for i in range(min(max_pages, len(reader.pages))):
                    text += reader.pages[i].extract_text()
                return text.lower()
        except:
            return ""
    
    def extract_document_name(self, pdf_path: str) -> Optional[str]:
        """
        Extract structured document name from PDF content.
        Returns name in format: {Institution}_{DocType}_{Topic}_{Year}
        """
        text = self.extract_pdf_text(pdf_path)
        if not text:
            return None
        
        # Determine institution
        institution = "SOET" if "school of engineering" in text or "soet" in text else "KRMU"
        
        # Extract year
        year_match = re.search(r'202[4-9][-–]\d{2}', text)
        year = year_match.group(0).replace('–', '-') if year_match else ""
        
        # Determine document type and topic
        doc_type, topic = self._identify_doc_type_and_topic(text)
        
        if not doc_type or not topic:
            return None
        
        # Build structured name
        name_parts = [institution, doc_type, topic]
        if year:
            name_parts.append(year)
        
        return "_".join(name_parts)
    
    def _identify_doc_type_and_topic(self, text: str) -> tuple[str, str]:
        """Identify document type and topic from text content"""
        
        # Calendar
        if "academic calendar" in text or ("calendar" in text and "exam" in text):
            return "Calendar", "Examination"
        
        # Handbook (non-syllabus)
        if "student handbook" in text and "syllabus" not in text:
            return "Handbook", "Student_General"
        
        # Syllabus - check before other types
        if "syllabus" in text or "course structure" in text or "curriculum" in text:
            if "bca" in text and ("aids" in text or "artificial intelligence" in text):
                return "Syllabus", "BCA_AIDS_Handbook"
            elif "bsc" in text or "b.sc" in text:
                return "Syllabus", "BSc_CS_Handbook"
            elif "aiml" in text or "ai & ml" in text or "ai&ml" in text:
                return "Syllabus", "BTech_AIML_Handbook"
            elif "cse" in text or ("computer science" in text and "engineering" in text):
                return "Syllabus", "BTech_CSE_Core"
        
        # Notice
        if "notice" in text or "notification" in text:
            if "icloud" in text or "course registration" in text:
                return "Notice", "Course_Registration_iCloud"
            elif "ufm" in text or "unfair means" in text:
                return "Notice", "UFM_Odd_Sem"
        
        # Guidelines
        if "guideline" in text:
            if "competitive" in text or "coding" in text:
                return "Guidelines", "Competitive_Coding"
            elif "laptop" in text:
                return "Guidelines", "Laptop_Classroom"
        
        # Instructions
        if "instruction" in text and "exam" in text:
            return "Instructions", "Examination"
        
        # Module
        if "placement" in text and "module" in text:
            return "Module", "Placement_Preparation"
        
        # Policy
        if "policy" in text and "attendance" in text:
            return "Policy", "Attendance"
        
        # Schedule
        if "schedule" in text and "semester" in text:
            return "Schedule", "Even_Semester_Commencement"
        
        # Standards
        if "assessment" in text and ("standard" in text or "in-class" in text):
            return "Standards", "In_Class_Assessment"
        
        return "", ""


# Singleton instance
_name_extractor = None

def get_name_extractor() -> DocumentNameExtractor:
    """Get or create name extractor singleton"""
    global _name_extractor
    if _name_extractor is None:
        _name_extractor = DocumentNameExtractor()
    return _name_extractor
