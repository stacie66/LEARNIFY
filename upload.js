// API base URL - ensure this matches your server structure
const API_BASE_URL = 'http://localhost:3000/api';

// Function to upload PDF
function uploadPDF() {
    const fileInput = document.getElementById('pdf-file');
    const messageArea = document.getElementById('message-area');
    
    // Clear previous messages
    messageArea.textContent = '';
    messageArea.className = 'message-area';
    messageArea.style.display = 'block';
    
    // Get current user from Firebase
    const user = firebase.auth().currentUser;
    
    if (!user) {
        messageArea.textContent = 'Please log in to upload files';
        messageArea.className = 'message-area error';
        return;
    }
    
    // Validate file input
    if (!fileInput.files[0]) {
        messageArea.textContent = 'Please select a PDF file';
        messageArea.className = 'message-area error';
        return;
    }
    
    // Validate file type
    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
        messageArea.textContent = 'Please select a valid PDF file';
        messageArea.className = 'message-area error';
        return;
    }
    
    // Create FormData object to send file
    const formData = new FormData();
    formData.append('pdf', file); // This must match the field name in your multer config
    formData.append('userId', user.uid); // Use Firebase UID as userId
    
    // Display loading indicator
    messageArea.textContent = 'Uploading...';
    
    // Send request to backend
    fetch(`${API_BASE_URL}/pdfs/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            // Try to get error message from server
            return response.text().then(text => {
                try {
                    // Try to parse as JSON
                    const data = JSON.parse(text);
                    throw new Error(data.message || 'Upload failed');
                } catch (e) {
                    // If not JSON, use status text
                    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
                }
            });
        }
        return response.json();
    })
    .then(data => {
        messageArea.className = 'message-area success';
        messageArea.textContent = 'PDF uploaded successfully!';
        
        // Clear input and selected file display
        fileInput.value = '';
        document.getElementById('selected-file').textContent = 'No file selected';
        
        // Refresh the PDF list
        fetchPDFs();
    })
    .catch(error => {
        console.error('Upload error:', error);
        messageArea.className = 'message-area error';
        messageArea.textContent = `Error: ${error.message}`;
    });
}

// Function to fetch PDFs for current user
function fetchPDFs() {
    const pdfsContainer = document.getElementById('pdfs-container');
    const messageArea = document.getElementById('message-area');
    
    // Get current user from Firebase
    const user = firebase.auth().currentUser;
    
    if (!user) {
        pdfsContainer.innerHTML = '<li>Please log in to view your PDFs</li>';
        return;
    }
    
    // Show loading indicator
    pdfsContainer.innerHTML = '<li>Loading your PDFs...</li>';
    
    // Fetch PDFs from the API
    fetch(`${API_BASE_URL}/pdfs/${user.uid}`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to fetch PDFs: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        pdfsContainer.innerHTML = '';
        
        if (!data || data.length === 0) {
            pdfsContainer.innerHTML = '<li>No PDFs found</li>';
            return;
        }
        
        data.forEach(pdf => {
            const li = document.createElement('li');
            li.className = 'pdf-item';
            
            // Create the URL for viewing
            const viewUrl = pdf.file_url || '';
            
            li.innerHTML = `
                <div>
                    <strong>${pdf.filename || ''}</strong> 
                    <span>(Uploaded: ${new Date(pdf.uploaded_at).toLocaleString()})</span>
                </div>
                <div class="pdf-actions">
                    <a href="${viewUrl}" target="_blank">View</a>
                    <a href="${viewUrl}" download>Download</a>
                    <button onclick="deletePDF('${pdf.id}')">Delete</button>
                </div>
            `;
            pdfsContainer.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Fetch PDFs error:', error);
        pdfsContainer.innerHTML = `<li>Error loading PDFs: ${error.message}</li>`;
    });
}

// Function to delete a PDF
function deletePDF(pdfId) {
    const messageArea = document.getElementById('message-area');
    messageArea.style.display = 'block';
    
    // Get current user from Firebase
    const user = firebase.auth().currentUser;
    
    if (!user) {
        messageArea.textContent = 'Please log in to delete files';
        messageArea.className = 'message-area error';
        return;
    }
    
    if (!confirm('Are you sure you want to delete this PDF?')) {
        return;
    }
    
    // Create form data for the DELETE request
    const formData = new FormData();
    formData.append('userId', user.uid);
    
    // Send DELETE request
    fetch(`${API_BASE_URL}/pdfs/${pdfId}`, {
        method: 'DELETE',
        // For DELETE requests, you might need to send the userId as a query parameter
        // or include it in headers depending on your backend implementation
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.uid })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to delete PDF: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        messageArea.className = 'message-area success';
        messageArea.textContent = data.message || 'PDF deleted successfully!';
        // Refresh the PDF list
        fetchPDFs();
    })
    .catch(error => {
        console.error('Delete error:', error);
        messageArea.className = 'message-area error';
        messageArea.textContent = `Error deleting PDF: ${error.message}`;
    });
}

// Add event listener for page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');
    
    // Check if Firebase auth is ready
    firebase.auth().onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out');
        
        if (user) {
            // User is signed in, fetch PDFs
            fetchPDFs();
            
            // Display user info
            const userInfo = document.getElementById('user-info');
            userInfo.innerHTML = `<p>Logged in as: ${user.email || user.phoneNumber || user.displayName || user.uid}</p>`;
        } else {
            // User is not signed in
            const messageArea = document.getElementById('message-area');
            messageArea.textContent = 'Please log in to upload and manage PDFs';
            messageArea.className = 'message-area error';
            messageArea.style.display = 'block';
            
            const pdfsContainer = document.getElementById('pdfs-container');
            pdfsContainer.innerHTML = '<li>Please log in to view your PDFs</li>';
        }
    });
    
    // Add event listener for upload button
    document.getElementById('upload-btn').addEventListener('click', uploadPDF);
});