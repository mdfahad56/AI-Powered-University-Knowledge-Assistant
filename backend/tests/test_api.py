from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_knowledge_areas():
    response = client.get('/api/knowledge/areas')
    assert response.status_code == 200
    assert 'areas' in response.json()


def test_chat_endpoint():
    response = client.post('/api/chat', json={'message': 'What are the graduation requirements?'})
    assert response.status_code == 200
    payload = response.json()
    assert 'answer' in payload
    assert 'sources' in payload
    assert len(payload['suggested_questions']) > 0
