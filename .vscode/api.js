const API_BASE_URL = 'http://localhost:5500/api'

class ApiService {
    static async fetchUserProgress(userId) {
        const response = await fetch(`${API_BASE_URL}/user-progress?user_id=${userId}`)
        return response.json()
    }

    static async createFlashcard(flashcardData) {
        const response = await fetch(`${API_BASE_URL}/flashcards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(flashcardData)
        })
        return response.json()
    }

    static async fetchFlashcards(userId) {
        const response = await fetch(`${API_BASE_URL}/flashcards?user_id=${userId}`)
        return response.json()
    }

    static async uploadPDF(formData) {
        const response = await fetch(`${API_BASE_URL}/pdf-uploads`, {
            method: 'POST',
            body: formData
        })
        return response.json()
    }
}