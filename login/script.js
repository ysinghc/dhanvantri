document.addEventListener('DOMContentLoaded', function() {
    // API Configuration
    const API_BASE_URL = 'https://api.ysinghc.me/api/v1';
    
    // User Type Selector
    const userTypeButtons = document.querySelectorAll('.user-type-btn');
    const patientLink = document.querySelector('.patient-link');
    const doctorLink = document.querySelector('.doctor-link');
    const hospitalLink = document.querySelector('.hospital-link');
    const loginForm = document.getElementById('loginForm');
    
    userTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            userTypeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show/hide appropriate registration links based on selected user type
            const userType = this.getAttribute('data-type');
            
            // Hide all registration links
            patientLink.classList.add('hidden');
            doctorLink.classList.add('hidden');
            hospitalLink.classList.add('hidden');
            
            // Show the appropriate registration link
            if (userType === 'patient') {
                patientLink.classList.remove('hidden');
            } else if (userType === 'doctor') {
                doctorLink.classList.remove('hidden');
            } else if (userType === 'hospital') {
                hospitalLink.classList.remove('hidden');
            }
            
            // Update form attribute
            loginForm.setAttribute('data-user-type', userType);
        });
    });
    
    // Toggle Password Visibility
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            // Toggle password visibility
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle the eye icon
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
    
    // Form Validation and Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const userType = this.getAttribute('data-user-type') || 'patient';
            const rememberMe = document.getElementById('remember').checked;
            
            // Simple validation
            if (!email || !password) {
                showMessage('Please enter both email and password', 'error');
                return;
            }
            
            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage('Please enter a valid email address', 'error');
                return;
            }
            
            // Show loading state
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Signing in...';
            submitButton.disabled = true;
            
            try {
                // Make API call to login
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Login failed. Please check your credentials.');
                }
                
                // Store auth token in localStorage
                localStorage.setItem('authToken', data.token);
                
                // Store refresh token if available
                if (data.refreshToken) {
                    localStorage.setItem('refreshToken', data.refreshToken);
                }
                
                // Store user info
                const storage = rememberMe ? localStorage : sessionStorage;
                
                // Check if data.user exists before accessing its properties
                if (!data.user) {
                    console.warn('API response missing user data');
                    // Use the form-selected userType as fallback
                    const userInfo = {
                        email: email,
                        userType: userType,
                        isLoggedIn: true,
                        lastLogin: new Date().toISOString()
                    };
                    storage.setItem('userInfo', JSON.stringify(userInfo));
                    
                    // Show success message
                    showMessage('Login successful! Redirecting...', 'success');
                    
                    // Redirect using the form-selected userType
                    setTimeout(() => {
                        redirectToDashboard(userType);
                    }, 1000);
                    return;
                }
                
                // Extract user data
                const userInfo = {
                    email: email,
                    userType: data.user.userType || userType, // Fallback to form userType if API doesn't provide it
                    userId: data.user._id || null,
                    name: data.user.name || email.split('@')[0], // Use first part of email as name if not provided
                    isLoggedIn: true,
                    lastLogin: new Date().toISOString()
                };
                
                // Store complete user data for dashboard
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                // Store basic user info
                storage.setItem('userInfo', JSON.stringify(userInfo));
                
                // Show success message
                showMessage('Login successful! Redirecting...', 'success');
                
                // If user is a patient, fetch complete profile data
                if (userInfo.userType === 'patient') {
                    try {
                        // Fetch patient profile data
                        await fetchPatientProfile(data.token);
                    } catch (error) {
                        console.error('Error fetching patient profile:', error);
                        // Continue with redirection even if profile fetch fails
                    }
                }
                
                // Redirect to appropriate dashboard
                setTimeout(() => {
                    redirectToDashboard(userInfo.userType);
                }, 1000);
            } catch (error) {
                console.error('Login error:', error);
                showMessage(error.message || 'Login failed. Please try again.', 'error');
                
                // Reset button state
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }
    
    // Government ID Login Button
    const govtIdButton = document.querySelector('.govt-id-btn');
    
    if (govtIdButton) {
        govtIdButton.addEventListener('click', function() {
            showMessage('Government ID login feature is not yet implemented', 'info');
        });
    }
    
    // Forgot Password Link
    const forgotPasswordLink = document.querySelector('.forgot-password');
    
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            
            if (!email) {
                showMessage('Please enter your email address first', 'error');
                return;
            }
            
            showMessage('Password reset functionality will be implemented soon.', 'info');
        });
    }
    
    // Helper Functions
    function showMessage(message, type = 'info') {
        // Check if a message container already exists
        let messageContainer = document.querySelector('.message-container');
        
        // If not, create one
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';
            document.querySelector('.login-form').prepend(messageContainer);
        }
        
        // Create the message element
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.className = 'close-message';
        closeBtn.onclick = function() {
            messageElement.remove();
        };
        messageElement.appendChild(closeBtn);
        
        // Add the message to the container
        messageContainer.appendChild(messageElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
        
        // Add styles for messages if not already present
        if (!document.getElementById('message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                .message-container {
                    margin-bottom: 20px;
                }
                .message {
                    padding: 10px 15px;
                    margin-bottom: 10px;
                    border-radius: var(--border-radius-sm);
                    position: relative;
                    animation: slideIn 0.3s ease forwards;
                }
                @keyframes slideIn {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .message.error {
                    background-color: #FFEBEE;
                    color: var(--error-color);
                    border-left: 3px solid var(--error-color);
                }
                .message.info {
                    background-color: #E3F2FD;
                    color: var(--info-color);
                    border-left: 3px solid var(--info-color);
                }
                .message.success {
                    background-color: #E8F5E9;
                    color: var(--success-color);
                    border-left: 3px solid var(--success-color);
                }
                .close-message {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    cursor: pointer;
                    font-size: 16px;
                    opacity: 0.7;
                }
                .close-message:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    function redirectToDashboard(userType) {
        // Redirect to appropriate dashboard based on user type
        switch(userType) {
            case 'patient':
                window.location.href = '../dashboard/patient/index.html';
                break;
            case 'doctor':
                window.location.href = '../dashboard/doctor/index.html';
                break;
            case 'hospital':
                window.location.href = '../dashboard/hospital/index.html';
                break;
            default:
                window.location.href = '../dashboard/patient/index.html';
        }
    }
    
    // Check if user is already logged in
    function checkLoginStatus() {
        try {
            const authToken = localStorage.getItem('authToken');
            
            // Get stored user info from localStorage or sessionStorage
            let userInfo = null;
            const localStorageInfo = localStorage.getItem('userInfo');
            const sessionStorageInfo = sessionStorage.getItem('userInfo');
            
            // Try to parse userInfo from storage
            try {
                if (localStorageInfo) {
                    userInfo = JSON.parse(localStorageInfo);
                } else if (sessionStorageInfo) {
                    userInfo = JSON.parse(sessionStorageInfo);
                }
            } catch (parseError) {
                console.error('Error parsing stored user info:', parseError);
                // Clear potentially corrupted data
                localStorage.removeItem('userInfo');
                sessionStorage.removeItem('userInfo');
                return; // Exit function if parsing fails
            }
            
            // Check if we have a token and userInfo
            if (authToken && userInfo && userInfo.isLoggedIn) {
                // Provide a fallback if userType is missing
                const userType = userInfo.userType || 'patient';
                
                // Check if we have the complete user data for dashboard
                const userData = localStorage.getItem('userData');
                if (!userData && userType === 'patient') {
                    // We have a token but no user data, try to fetch it
                    console.log('User is logged in but userData is missing, fetching profile...');
                    
                    // Async function to fetch missing data
                    (async () => {
                        try {
                            await fetchPatientProfile(authToken);
                        } catch (error) {
                            console.error('Failed to fetch profile data during login check:', error);
                            // Continue with redirect even if fetch fails
                        } finally {
                            // Redirect to dashboard regardless of fetch outcome
                            redirectToDashboard(userType);
                        }
                    })();
                    
                    return; // Exit early since we're handling redirect in the async function
                }
                
                // Redirect to dashboard
                redirectToDashboard(userType);
            }
        } catch (error) {
            console.error('Error checking login status:', error);
        }
    }
    
    // Check login status on page load
    checkLoginStatus();
    
    /**
     * Fetch complete patient profile data
     */
    async function fetchPatientProfile(token) {
        try {
            const response = await fetch('https://api.ysinghc.me/api/v1/patients/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch patient profile');
            }
            
            const profileData = await response.json();
            
            // Check if we have data and update localStorage
            if (profileData) {
                // Handle both response formats (with or without user wrapper)
                const userData = profileData.user || profileData;
                
                // Store the complete profile data
                localStorage.setItem('userData', JSON.stringify(userData));
                console.log('Patient profile data stored successfully');
            }
        } catch (error) {
            console.error('Error fetching patient profile:', error);
            // Don't block login process if profile fetch fails
        }
    }
}); 