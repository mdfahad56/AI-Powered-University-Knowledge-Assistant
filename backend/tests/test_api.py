from fastapi.testclient import TestClient

from app.database import build_database_url, get_db, reset_test_storage_if_needed
from app.main import app
from app.models import QuestionPaperResource

client = TestClient(app)


def test_root_env_is_loaded_for_database_config():
    database_url = build_database_url()
    assert 'mysql+pymysql' in database_url
    assert 'university_assistant' in database_url


def test_health_check():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_knowledge_areas():
    response = client.get('/api/knowledge/areas')
    assert response.status_code == 200
    assert 'areas' in response.json()


def test_upload_question_paper_and_list_it():
    reset_test_storage_if_needed()
    db = next(get_db())
    try:
        db.query(QuestionPaperResource).delete()
        db.commit()
    finally:
        db.close()

    pdf_bytes = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 73 >>\nstream\nBT\n/F1 18 Tf\n50 50 Td\n(DBMS sample question) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'

    response = client.post(
        '/api/resources/upload',
        files={'file': ('DBMS_EndSem_2025.pdf', pdf_bytes, 'application/pdf')},
        data={
            'type': 'question_paper',
            'subject': 'DBMS',
            'semester': '6',
            'branch': 'CSE',
            'year': '2025',
            'exam_type': 'End Semester',
        },
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload['filename'] == 'DBMS_EndSem_2025.pdf'
    assert payload['metadata']['subject'] == 'DBMS'

    listing = client.get('/api/resources')
    assert listing.status_code == 200
    assert any(item['filename'] == 'DBMS_EndSem_2025.pdf' for item in listing.json()['items'])


def test_upload_keeps_original_pdf_separate_from_metadata():
    db = next(get_db())
    try:
        db.query(QuestionPaperResource).filter(QuestionPaperResource.filename.like('cyber%')).delete()
        db.commit()
    finally:
        db.close()

    pdf_bytes = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'

    response = client.post(
        '/api/resources/upload',
        files={'file': ('cyber.pdf', pdf_bytes, 'application/pdf')},
        data={
            'type': 'question_paper',
            'degree': 'BCA',
            'course': 'DBMS',
            'subject': 'DBMS',
            'semester': '6',
            'branch': 'CSE',
            'year': '2025',
            'exam_type': 'End Semester',
        },
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    resource_id = payload['id']
    assert payload['filename'] == 'cyber.pdf'
    assert payload['metadata']['document_type'] == 'question_paper'
    assert payload['metadata']['degree'] == 'BCA'
    assert payload['metadata']['course'] == 'DBMS'
    assert payload['metadata']['filename'] == 'cyber.pdf'
    assert payload['metadata']['academic_year'] == '2025'

    file_response = client.get(f'/api/resources/{resource_id}/file')
    assert file_response.status_code == 200
    assert file_response.content.startswith(b'%PDF')
    assert 'inline' in file_response.headers.get('content-disposition', '').lower()
    assert 'cyber.pdf' in file_response.headers.get('content-disposition', '').lower()


def test_chat_endpoint():
    response = client.post('/api/chat', json={'message': 'What are the graduation requirements?'})
    assert response.status_code == 200
    payload = response.json()
    assert 'answer' in payload
    assert 'sources' in payload
    assert len(payload['suggested_questions']) > 0


def test_support_submission_and_db_persistence():
    payload = {
        "first_name": "Priya",
        "last_name": "Verma",
        "country": "India",
        "phone": "+91 9876543210",
        "email": "priya.verma@aktu.ac.in",
        "inquiry_type": "Technical Support",
        "message": "I am unable to download the question paper for Semester 5.",
        "newsletter": True,
    }
    response = client.post("/api/support", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "success"
    assert "submitted successfully" in data["message"].lower()
    assert data["data"]["first_name"] == "Priya"
    assert data["data"]["country"] == "India"
    assert data["data"]["newsletter"] is True
    assert data["data"]["status"] == "pending"

    listing = client.get("/api/support")
    assert listing.status_code == 200
    items = listing.json()["items"]
    assert any(i["email"] == "priya.verma@aktu.ac.in" and i["country"] == "India" for i in items)


def test_support_validation_errors():
    invalid_payload = {
        "first_name": "Test",
        "last_name": "User",
        "country": "India",
        "phone": "123",
        "email": "not-an-email",
        "inquiry_type": "General",
        "message": "",
        "newsletter": False,
    }
    response = client.post("/api/support", json=invalid_payload)
    assert response.status_code == 422

