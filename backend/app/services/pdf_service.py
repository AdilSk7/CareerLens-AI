import fitz
import os
import httpx
async def extract_text_from_pdf_path(pdf_path: str) -> str:
    """
    Extracts text from a local PDF using PyMuPDF (fitz).
    """
    try:
        if not os.path.exists(pdf_path):
            raise ValueError("PDF file does not exist on disk.")
            
        # Parse with PyMuPDF
        text = ""
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text()
        doc.close()

        if not text.strip():
            raise ValueError("No extractable text found in this PDF.")
            
        return text.strip()

    except Exception as e:
        raise ValueError(f"Failed to process PDF: {e}")
