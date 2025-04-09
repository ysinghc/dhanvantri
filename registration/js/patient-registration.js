// Base API URL
const API_BASE_URL = 'https://api.ysinghc.me/api/v1';

// DOM Elements
const progressSteps = document.querySelectorAll('.progress-step');
const formSteps = document.querySelectorAll('.form-step');
const nextButtons = document.querySelectorAll('.next-step');
const prevButtons = document.querySelectorAll('.prev-step');
const togglePassword = document.querySelector('.toggle-password');
const passwordInput = document.getElementById('password');
const strengthBar = document.querySelector('.strength-bar');
const registrationForm = document.getElementById('patientRegistrationForm');
const submitButton = document.querySelector('.submit-btn');

// Initialize form behavior
document.addEventListener('DOMContentLoaded', function() {
    initFormSteps();
    initPasswordToggle();
    initPasswordStrength();
    
    // Handle form submission
    registrationForm.addEventListener('submit', handleFormSubmit);
});

// Form steps navigation
function initFormSteps() {
    // Next buttons
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = parseInt(this.dataset.next) - 1;
            const nextStep = parseInt(this.dataset.next);
            
            if (validateStep(currentStep)) {
                goToStep(nextStep);
            }
        });
    });
    
    // Previous buttons
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = parseInt(this.dataset.prev);
            goToStep(prevStep);
        });
    });
}

// Go to specified form step
function goToStep(stepNumber) {
    // Update form steps
    formSteps.forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector(`.form-step[data-step="${stepNumber}"]`).classList.add('active');
    
    // Update progress indicators
    progressSteps.forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');
        
        if (stepNum < stepNumber) {
            step.classList.add('completed');
        } else if (stepNum === stepNumber) {
            step.classList.add('active');
        }
    });
    
    // Scroll to top of form
    document.querySelector('.registration-section').scrollTo(0, 0);
}

// Toggle password visibility
function initPasswordToggle() {
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// Password strength meter
function initPasswordStrength() {
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        // Update strength bar
        strengthBar.style.width = `${strength}%`;
        
        // Change color based on strength
        if (strength < 33) {
            strengthBar.style.backgroundColor = '#ff4d4d'; // Red
        } else if (strength < 66) {
            strengthBar.style.backgroundColor = '#ffb84d'; // Orange
        } else {
            strengthBar.style.backgroundColor = '#4CAF50'; // Green
        }
    });
}

// Calculate password strength (0-100)
function calculatePasswordStrength(password) {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length contribution (up to 30%)
    strength += Math.min(30, Math.floor(password.length * 3));
    
    // Character variety contribution (up to 70%)
    if (/[A-Z]/.test(password)) strength += 15; // Uppercase
    if (/[a-z]/.test(password)) strength += 10; // Lowercase
    if (/[0-9]/.test(password)) strength += 20; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 25; // Special characters
    
    return Math.min(100, strength);
}

// Validate each step of the form
function validateStep(stepNumber) {
    let isValid = true;
    
    switch (stepNumber) {
        case 1:
            // Account Information
            const fullName = document.getElementById('fullName');
            const email = document.getElementById('email');
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirmPassword');
            
            // Clear previous validation errors
            document.querySelectorAll('.validation-error').forEach(el => el.remove());
            document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
            
            // Validate full name
            if (!fullName.value.trim()) {
                showValidationError(fullName, 'Full name is required');
                isValid = false;
            } else if (fullName.value.trim().length < 3) {
                showValidationError(fullName, 'Name should be at least 3 characters');
                isValid = false;
            }
            
            // Validate email
            if (!email.value.trim()) {
                showValidationError(email, 'Email is required');
                isValid = false;
            } else if (!validateEmail(email.value)) {
                showValidationError(email, 'Please enter a valid email address');
                isValid = false;
            }
            
            // Validate password
            if (!password.value) {
                showValidationError(password, 'Password is required');
                isValid = false;
            } else if (password.value.length < 8) {
                showValidationError(password, 'Password should be at least 8 characters');
                isValid = false;
            } else if (calculatePasswordStrength(password.value) < 50) {
                showValidationError(password, 'Password is too weak. Add uppercase, numbers or special characters');
                isValid = false;
            }
            
            // Validate password confirmation
            if (!confirmPassword.value) {
                showValidationError(confirmPassword, 'Please confirm your password');
                isValid = false;
            } else if (confirmPassword.value !== password.value) {
                showValidationError(confirmPassword, 'Passwords do not match');
                isValid = false;
            }
            
            break;
            
        case 2:
            // Personal Information
            const phone = document.getElementById('phone');
            const dob = document.getElementById('dob');
            const gender = document.querySelector('input[name="gender"]:checked');
            
            // Clear previous validation errors
            document.querySelectorAll('.validation-error').forEach(el => el.remove());
            document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
            
            // Validate phone
            if (!phone.value.trim()) {
                showValidationError(phone, 'Phone number is required');
                isValid = false;
            } else if (!validatePhone(phone.value)) {
                showValidationError(phone, 'Please enter a valid 10-digit phone number');
                isValid = false;
            }
            
            // Validate date of birth
            if (!dob.value) {
                showValidationError(dob, 'Date of birth is required');
                isValid = false;
            }
            
            // Validate gender
            if (!gender) {
                const genderGroup = document.querySelector('.radio-group.gender-group');
                showValidationError(genderGroup.querySelector('input'), 'Please select your gender');
                isValid = false;
            }
            
            break;
            
        case 3:
            // Address and Medical History
            const street = document.getElementById('street');
            const city = document.getElementById('city');
            const state = document.getElementById('state');
            const pincode = document.getElementById('pincode');
            const country = document.getElementById('country');
            
            // Clear previous validation errors
            document.querySelectorAll('.validation-error').forEach(el => el.remove());
            document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
            
            // Validate street address
            if (!street.value.trim()) {
                showValidationError(street, 'Street address is required');
                isValid = false;
            }
            
            // Validate city
            if (!city.value.trim()) {
                showValidationError(city, 'City is required');
                isValid = false;
            }
            
            // Validate state
            if (!state.value.trim()) {
                showValidationError(state, 'State/Province is required');
                isValid = false;
            }
            
            // Validate pincode
            if (!pincode.value.trim()) {
                showValidationError(pincode, 'Postal/Zip code is required');
                isValid = false;
            } else if (!validatePincode(pincode.value)) {
                showValidationError(pincode, 'Please enter a valid 6-digit postal code');
                isValid = false;
            }
            
            // Validate country
            if (!country.value.trim()) {
                showValidationError(country, 'Country is required');
                isValid = false;
            }
            
            break;
            
        case 4:
            // Terms and Consent
            const termsConsent = document.getElementById('termsConsent');
            const privacyConsent = document.getElementById('privacyConsent');
            const dataConsent = document.getElementById('dataConsent');
            
            // Clear previous validation errors
            document.querySelectorAll('.validation-error').forEach(el => el.remove());
            document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
            
            // Validate consent checkboxes
            if (!termsConsent.checked) {
                showValidationError(termsConsent, 'You must agree to the Terms and Conditions');
                isValid = false;
            }
            
            if (!privacyConsent.checked) {
                showValidationError(privacyConsent, 'You must agree to the Privacy Policy');
                isValid = false;
            }
            
            if (!dataConsent.checked) {
                showValidationError(dataConsent, 'You must agree to the Data Processing');
                isValid = false;
            }
            
            break;
    }
    
    return isValid;
}

// Display validation error message
function showValidationError(input, message) {
    input.classList.add('input-error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'validation-error';
    errorElement.textContent = message;
    
    // For checkboxes and radio buttons
    if (input.type === 'checkbox' || input.type === 'radio') {
        const parent = input.closest('.checkbox-group, .radio-group');
        parent.appendChild(errorElement);
    } else {
        input.parentNode.appendChild(errorElement);
    }
    
    // Remove error on input
    input.addEventListener('input', function() {
        this.classList.remove('input-error');
        const error = this.parentNode.querySelector('.validation-error');
        if (error) error.remove();
    }, { once: true });
}

// Validation helpers
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^[0-9]{10}$/.test(phone.replace(/[^0-9]/g, ''));
}

function validatePincode(pincode) {
    return /^[0-9]{6}$/.test(pincode);
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate final step
    if (!validateStep(4)) {
        return;
    }
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';
    submitButton.classList.add('loading');
    
    try {
        const formData = collectFormData();
        
        // Send registration data to API
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show success message
            showSuccessMessage();
            
            // Redirect to login page after a delay
            setTimeout(() => {
                window.location.href = '../login/?registered=success';
            }, 2000);
        } else {
            // Show error message
            showErrorMessage(data.message || 'Registration failed. Please try again.');
            
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = 'Create Account';
            submitButton.classList.remove('loading');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showErrorMessage('Network error. Please check your connection and try again.');
        
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
        submitButton.classList.remove('loading');
    }
}

// Collect all form data
function collectFormData() {
    // Generate a unique health ID 
    const generateHealthId = () => {
        const prefix = 'DH';
        const timestamp = new Date().getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}${timestamp}${random}`;
    };
    
    const bloodGroup = document.getElementById('bloodType').value;
    const allergiesText = document.getElementById('allergies').value;
    const chronicConditionsText = document.getElementById('preExistingConditions').value;
    
    // Parse allergies into array
    const allergies = allergiesText ? allergiesText.split(',').map(item => item.trim()) : [];
    
    // Parse chronic conditions into array
    const chronicConditions = chronicConditionsText ? chronicConditionsText.split(',').map(item => item.trim()) : [];
    
    // Format for registration request that matches the DB schema
    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        userType: 'patient',
        healthId: generateHealthId(),
        name: document.getElementById('fullName').value,
        dateOfBirth: document.getElementById('dob').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        contactNumber: document.getElementById('phone').value,
        bloodGroup: bloodGroup || undefined,
        address: {
            street: document.getElementById('street').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            postalCode: document.getElementById('pincode').value,
            country: document.getElementById('country').value
        },
        emergencyContact: {
            name: document.getElementById('emergencyName').value || "",
            relationship: document.getElementById('emergencyRelation').value || "",
            phone: document.getElementById('emergencyPhone').value || ""
        },
        allergies: allergies,
        chronicConditions: chronicConditions
    };
    
    // Add height and weight if provided
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;
    
    if (height && !isNaN(parseInt(height))) {
        formData.height = parseInt(height);
    }
    
    if (weight && !isNaN(parseInt(weight))) {
        formData.weight = parseInt(weight);
    }
    
    return formData;
}

// Show success message
function showSuccessMessage() {
    const formContainer = document.querySelector('.registration-section');
    const successMessage = document.createElement('div');
    successMessage.className = 'registration-success';
    successMessage.innerHTML = `
        <div class="success-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <h3>Registration Successful!</h3>
        <p>Your account has been created. You can now log in to access your health services.</p>
    `;
    
    // Replace form with success message
    formContainer.innerHTML = '';
    formContainer.appendChild(successMessage);
}

// Show error message
function showErrorMessage(message) {
    // Remove any existing error message
    const existingError = document.querySelector('.form-error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    const formContainer = document.querySelector('.form-step[data-step="4"]');
    formContainer.insertBefore(errorDiv, formContainer.firstChild);
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
} 