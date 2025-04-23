document.addEventListener('DOMContentLoaded', async () => {
    // Assuming you have user authentication and can get user ID
    const userId = 'your-user-id' // Replace with actual user ID

    try {
        const progress = await ApiService.fetchUserProgress(userId)
        
        document.getElementById('flashcards-count').textContent = progress.flashcards_created
        document.getElementById('quizzes-count').textContent = progress.quizzes_completed
        document.getElementById('current-level').textContent = progress.current_level
    } catch (error) {
        console.error('Failed to fetch user progress:', error)
    }
})