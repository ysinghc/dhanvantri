document.addEventListener('DOMContentLoaded', function() {
    // API Configuration
    const API_BASE_URL = 'https://api.ysinghc.me/api/v1';
    
    // Form steps navigation
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const form = document.getElementById('patientRegistrationForm');
    
    // Password visibility toggle
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
    
    // Password strength meter
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strengthBar = document.querySelector('.strength-bar');
            const passwordHint = document.querySelector('.password-hint');
            
            // Remove any existing strength classes
            strengthBar.classList.remove('strength-weak', 'strength-medium', 'strength-strong', 'strength-very-strong');
            
            if (password.length === 0) {
                strengthBar.style.width = '0';
                passwordHint.textContent = 'Must be at least 8 characters with letters, numbers, and special characters';
                return;
            }
            
            // Calculate password strength
            let strength = 0;
            
            // Length check
            if (password.length >= 8) {
                strength += 1;
            }
            
            // Contains lowercase
            if (/[a-z]/.test(password)) {
                strength += 1;
            }
            
            // Contains uppercase
            if (/[A-Z]/.test(password)) {
                strength += 1;
            }
            
            // Contains number
            if (/[0-9]/.test(password)) {
                strength += 1;
            }
            
            // Contains special character
            if (/[^A-Za-z0-9]/.test(password)) {
                strength += 1;
            }
            
            // Update strength bar
            if (strength === 1) {
                strengthBar.classList.add('strength-weak');
                passwordHint.textContent = 'Weak - use longer password with mix of characters';
            } else if (strength === 2) {
                strengthBar.classList.add('strength-medium');
                passwordHint.textContent = 'Medium - add numbers or special characters';
            } else if (strength === 3 || strength === 4) {
                strengthBar.classList.add('strength-strong');
                passwordHint.textContent = 'Strong - good password!';
            } else if (strength === 5) {
                strengthBar.classList.add('strength-very-strong');
                passwordHint.textContent = 'Very strong - excellent password!';
            }
        });
    }
    
    // Conditional form fields for medical history
    const allergiesRadio = document.querySelectorAll('input[name="hasAllergies"]');
    const allergiesContainer = document.querySelector('.allergies-container');
    
    allergiesRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes') {
                allergiesContainer.classList.remove('hidden');
            } else {
                allergiesContainer.classList.add('hidden');
            }
        });
    });
    
    const conditionsRadio = document.querySelectorAll('input[name="hasConditions"]');
    const conditionsContainer = document.querySelector('.conditions-container');
    
    conditionsRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes') {
                conditionsContainer.classList.remove('hidden');
            } else {
                conditionsContainer.classList.add('hidden');
            }
        });
    });
    
    const medicationsRadio = document.querySelectorAll('input[name="hasMedications"]');
    const medicationsContainer = document.querySelector('.medications-container');
    
    medicationsRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes') {
                medicationsContainer.classList.remove('hidden');
            } else {
                medicationsContainer.classList.add('hidden');
            }
        });
    });
    
    // Verification method selection
    const verifyMethodRadios = document.querySelectorAll('input[name="verifyMethod"]');
    const govtVerificationSection = document.querySelector('.govt-verification');
    const mobileVerificationSection = document.querySelector('.mobile-verification');
    
    verifyMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'govtId') {
                govtVerificationSection.classList.remove('hidden');
                mobileVerificationSection.classList.add('hidden');
            } else if (this.value === 'mobile') {
                govtVerificationSection.classList.add('hidden');
                mobileVerificationSection.classList.remove('hidden');
            }
        });
    });
    
    // Send OTP functionality
    const sendOtpBtn = document.querySelector('.send-otp-btn');
    const otpInputGroup = document.querySelector('.otp-input-group');
    const otpInputs = document.querySelectorAll('.otp-input');
    const otpTimerElement = document.getElementById('otpTimer');
    
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', function() {
            const phoneInput = document.getElementById('verifyPhone');
            const phoneNumber = phoneInput.value.trim();
            
            if (!phoneNumber) {
                showValidationError(phoneInput, 'Please enter a phone number');
                return;
            }
            
            // Simulate OTP sending
            this.disabled = true;
            this.textContent = 'Sending...';
            
            setTimeout(() => {
                this.textContent = 'Sent';
                otpInputGroup.classList.remove('hidden');
                
                // Set focus on first OTP input
                otpInputs[0].focus();
                
                // Start OTP timer
                startOtpTimer();
            }, 1500);
        });
    }
    
    // OTP inputs handling
    if (otpInputs.length) {
        otpInputs.forEach((input, index) => {
            // Handle input
            input.addEventListener('input', function(e) {
                // Only allow numbers
                this.value = this.value.replace(/[^0-9]/g, '');
                
                // Auto move to next input if filled
                if (this.value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
                
                // Collect all OTP digits
                collectOtpValue();
            });
            
            // Handle key press
            input.addEventListener('keydown', function(e) {
                // Move back on backspace if empty
                if (e.key === 'Backspace' && !this.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
            
            // Handle paste
            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pasteData = e.clipboardData.getData('text').trim();
                
                // If the pasted data matches the expected pattern (6 digits)
                if (/^\d{6}$/.test(pasteData)) {
                    // Fill all inputs with respective digits
                    for (let i = 0; i < Math.min(6, pasteData.length); i++) {
                        otpInputs[i].value = pasteData[i];
                    }
                    
                    // Collect OTP value
                    collectOtpValue();
                }
            });
        });
    }
    
    function collectOtpValue() {
        let otp = '';
        otpInputs.forEach(input => {
            otp += input.value;
        });
        
        // Store in hidden field
        document.getElementById('otpCode').value = otp;
    }
    
    function startOtpTimer() {
        let timeLeft = 60;
        otpTimerElement.textContent = timeLeft;
        
        const timerInterval = setInterval(() => {
            timeLeft--;
            otpTimerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                otpTimerElement.parentElement.innerHTML = '<a href="#" class="resend-otp">Resend OTP</a>';
                
                // Add event listener to resend link
                document.querySelector('.resend-otp').addEventListener('click', function(e) {
                    e.preventDefault();
                    startOtpTimer();
                    this.parentElement.innerHTML = 'Resend OTP in <span id="otpTimer">60</span> seconds';
                    otpTimerElement = document.getElementById('otpTimer');
                });
            }
        }, 1000);
    }
    
    // File upload preview
    const fileUpload = document.getElementById('idUpload');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');
    
    if (fileUpload && uploadPlaceholder) {
        fileUpload.addEventListener('change', function(e) {
            const files = e.target.files;
            
            if (files.length > 0) {
                // Update the upload placeholder with file info
                uploadPlaceholder.innerHTML = `
                    <i class="fas fa-file"></i>
                    <span>${files.length} file(s) selected</span>
                    <small>${files[0].name}</small>
                `;
            } else {
                // Reset placeholder
                uploadPlaceholder.innerHTML = `
                    <i class="fas fa-upload"></i>
                    <span>Click to select files or drag and drop</span>
                `;
            }
        });
    }
    
    // Form step navigation
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = parseInt(this.getAttribute('data-next')) - 1;
            const nextStep = parseInt(this.getAttribute('data-next'));
            
            // Validate current step
            if (!validateStep(currentStep)) {
                return;
            }
            
            // If validation passes, proceed to next step
            formSteps.forEach(step => step.classList.remove('active'));
            formSteps[nextStep - 1].classList.add('active');
            
            // Update progress tracker
            progressSteps.forEach(step => step.classList.remove('active'));
            progressSteps[nextStep - 1].classList.add('active');
            
            // Mark previous steps as completed
            for (let i = 0; i < nextStep - 1; i++) {
                progressSteps[i].classList.add('completed');
            }
            
            // Scroll to top
            window.scrollTo(0, 0);
        });
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = parseInt(this.getAttribute('data-prev'));
            
            // Navigate to previous step
            formSteps.forEach(step => step.classList.remove('active'));
            formSteps[prevStep - 1].classList.add('active');
            
            // Update progress tracker
            progressSteps.forEach(step => step.classList.remove('active'));
            progressSteps[prevStep - 1].classList.add('active');
            
            // Scroll to top
            window.scrollTo(0, 0);
        });
    });
    
    // Form submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate the final step
            if (!validateStep(4)) {
                return;
            }
            
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            try {
                // Gather all form data
                const formData = {
                    // Account Information
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value,
                    userType: 'patient',
                    name: document.getElementById('fullName').value,
                    
                    // Personal Information
                    phone: document.getElementById('phone').value,
                    dateOfBirth: document.getElementById('dob').value,
                    gender: document.querySelector('input[name="gender"]:checked').value,
                    bloodType: document.getElementById('bloodType').value,
                    
                    // Address
                    address: {
                        street: document.getElementById('street').value,
                        city: document.getElementById('city').value,
                        state: document.getElementById('state').value,
                        pincode: document.getElementById('pincode').value,
                        country: document.getElementById('country').value
                    },
                    
                    // Medical History
                    medicalHistory: {
                        allergies: document.querySelector('input[name="hasAllergies"]:checked').value === 'yes' 
                            ? document.getElementById('allergies').value.split(',').map(item => item.trim())
                            : [],
                        conditions: document.querySelector('input[name="hasConditions"]:checked').value === 'yes'
                            ? document.getElementById('conditions').value.split(',').map(item => item.trim())
                            : [],
                        medications: document.querySelector('input[name="hasMedications"]:checked').value === 'yes'
                            ? document.getElementById('medications').value.split(',').map(item => item.trim())
                            : [],
                        familyHistory: document.getElementById('familyHistory').value
                    },
                    
                    // Emergency Contact
                    emergencyContact: {
                        name: document.getElementById('emergencyName').value,
                        phone: document.getElementById('emergencyPhone').value,
                        relationship: document.getElementById('emergencyRelationship').value
                    }
                };
                
                // Make API call to register user
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed. Please try again.');
                }
                
                // Show success message
                alert('Registration successful! You will be redirected to the login page.');
                
                // Redirect to login page
                window.location.href = '../login/index.html';
            } catch (error) {
                console.error('Registration error:', error);
                
                // Show error message
                alert(`Registration failed: ${error.message}`);
                
                // Reset button state
                submitButton.disabled = false;
                submitButton.innerHTML = 'Create Account';
            }
        });
    }
    
    // Step validation logic
    function validateStep(stepNumber) {
        const currentStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
        const requiredFields = currentStep.querySelectorAll('[required]');
        let isValid = true;
        
        // Remove any existing validation errors
        currentStep.querySelectorAll('.validation-error').forEach(error => error.remove());
        
        // Check all required fields
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                showValidationError(field, 'This field is required');
                isValid = false;
            }
        });
        
        // Step-specific validation
        if (stepNumber === 1) {
            // Email validation
            const emailField = document.getElementById('email');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (emailField.value && !emailRegex.test(emailField.value)) {
                showValidationError(emailField, 'Please enter a valid email address');
                isValid = false;
            }
            
            // Password validation
            const passwordField = document.getElementById('password');
            const confirmPasswordField = document.getElementById('confirmPassword');
            
            if (passwordField.value) {
                if (passwordField.value.length < 8) {
                    showValidationError(passwordField, 'Password must be at least 8 characters long');
                    isValid = false;
                }
                
                if (!/[A-Za-z]/.test(passwordField.value) || !/[0-9]/.test(passwordField.value)) {
                    showValidationError(passwordField, 'Password must contain both letters and numbers');
                    isValid = false;
                }
            }
            
            // Confirm password validation
            if (passwordField.value !== confirmPasswordField.value) {
                showValidationError(confirmPasswordField, 'Passwords do not match');
                isValid = false;
            }
            
            // Terms agreement validation
            const termsCheckbox = document.getElementById('termsAgreement');
            if (!termsCheckbox.checked) {
                showValidationError(termsCheckbox, 'You must agree to the terms to continue');
                isValid = false;
            }
        } else if (stepNumber === 2) {
            // Phone number validation
            const phoneField = document.getElementById('phone');
            if (phoneField.value && !/^\d{10}$/.test(phoneField.value.replace(/\D/g, ''))) {
                showValidationError(phoneField, 'Please enter a valid 10-digit phone number');
                isValid = false;
            }
            
            // Government ID validation
            const govtIdField = document.getElementById('govtId');
            if (govtIdField.value && govtIdField.value.length < 8) {
                showValidationError(govtIdField, 'Please enter a valid government ID');
                isValid = false;
            }
        } else if (stepNumber === 4) {
            // Verify consent checkboxes
            const dataConsent = document.getElementById('dataConsent');
            const emergencyConsent = document.getElementById('emergencyConsent');
            
            if (!dataConsent.checked) {
                showValidationError(dataConsent, 'You must consent to data storage to continue');
                isValid = false;
            }
            
            if (!emergencyConsent.checked) {
                showValidationError(emergencyConsent, 'You must authorize emergency access to continue');
                isValid = false;
            }
            
            // Verify ID upload if government ID verification is selected
            const verifyMethod = document.querySelector('input[name="verifyMethod"]:checked').value;
            
            if (verifyMethod === 'govtId') {
                const idNumber = document.getElementById('idNumber');
                const idUpload = document.getElementById('idUpload');
                
                if (!idNumber.value) {
                    showValidationError(idNumber, 'Please enter your ID number');
                    isValid = false;
                }
                
                if (idUpload.files.length === 0) {
                    showValidationError(idUpload, 'Please upload your ID document');
                    isValid = false;
                }
            } else if (verifyMethod === 'mobile') {
                const otpCode = document.getElementById('otpCode');
                
                if (!otpCode.value || otpCode.value.length !== 6) {
                    showValidationError(document.querySelector('.otp-inputs'), 'Please enter the complete OTP');
                    isValid = false;
                }
            }
        }
        
        return isValid;
    }
    
    // Show validation error
    function showValidationError(field, message) {
        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error';
        errorElement.textContent = message;
        errorElement.style.color = 'var(--error-color)';
        errorElement.style.fontSize = '0.85rem';
        errorElement.style.marginTop = '5px';
        
        // Position it after the field or its parent for special cases
        if (field.type === 'checkbox' || field.type === 'radio') {
            field.closest('.checkbox-group, .radio-group').appendChild(errorElement);
        } else if (field.classList.contains('otp-input') || field.closest('.otp-inputs')) {
            // For OTP inputs, append after the container
            field.closest('.form-group').appendChild(errorElement);
        } else if (field.type === 'file') {
            // For file inputs, append after the container
            field.closest('.form-group').appendChild(errorElement);
        } else {
            // For regular inputs, insert after the input or its container
            const targetElement = field.closest('.input-with-icon') || field;
            targetElement.parentNode.insertBefore(errorElement, targetElement.nextSibling);
        }
        
        // Highlight the field
        field.style.borderColor = 'var(--error-color)';
        field.style.backgroundColor = 'rgba(211, 47, 47, 0.05)';
        
        // Remove highlighting and error on field interaction
        field.addEventListener('input', function() {
            this.style.borderColor = '';
            this.style.backgroundColor = '';
            const error = this.parentNode.querySelector('.validation-error');
            if (error) {
                error.remove();
            }
        }, { once: true });
    }
}); 