// API Configuration
const API_BASE_URL = 'https://api.ysinghc.me/api/v1';
let authToken = localStorage.getItem('authToken');

// API Request helper
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        // Handle token expiration
        if (response.status === 401) {
            // Try to refresh token
            const refreshed = await refreshToken();
            if (refreshed) {
                // Retry with new token
                options.headers.Authorization = `Bearer ${authToken}`;
                const retryResponse = await fetch(url, options);
                if (retryResponse.ok) {
                    return await retryResponse.json();
                }
            }
            
            // If refresh failed or retry failed, redirect to login
            showNotification('Your session has expired. Please log in again.', 'error');
            setTimeout(() => {
                logoutUser(true);
            }, 2000);
            return null;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `API request failed with status ${response.status}`;
            console.error('API Error:', errorMessage);
            showNotification(errorMessage, 'error');
            return null;
        }
        
        // Check if response is empty
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return true; // Success with no content
    } catch (error) {
        console.error('API Request Error:', error);
        showNotification('Unable to connect to the server. Please check your connection.', 'error');
        return null;
    }
}

/**
 * Refresh the authentication token
 */
async function refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });
        
        if (!response.ok) {
            return false;
        }
        
        const data = await response.json();
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            authToken = data.token;
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Token refresh error:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is authenticated
    if (!authToken) {
        window.location.href = '../../login/';
        return;
    }
    
    // Initialize UI components
    initSidebar();
    initTabNavigation();
    initEventListeners();
    initSearch();
    initAppointmentForm();
    
    // Show loading indicator
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"></div><p>Loading your dashboard...</p>';
    document.body.appendChild(loadingOverlay);
    
    try {
        // Fetch all necessary data in parallel
        const [userData, healthMetrics, appointments, prescriptions] = await Promise.all([
            fetchUserData(),
            apiRequest('/health-metrics/summary?timespan=6m'),
            fetchAppointments(),
            apiRequest('/prescriptions')
        ]);
        
        // Once data is loaded, initialize components that need the data
        if (healthMetrics) {
            initCharts(healthMetrics);
        }
        
        // Update medications list
        if (prescriptions && prescriptions.length > 0) {
            updateMedicationsList(prescriptions);
        }
        
        // Initialize notifications after user data is loaded
        await initNotifications();
        
        // Initialize emergency card after user data is loaded
        await initEmergencyCard();
        
        // Show dashboard content
        document.querySelector('.loading-overlay')?.remove();
        document.querySelector('.content-wrapper')?.classList.add('page-active');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Some data could not be loaded. Please refresh the page or try again later.', 'error');
        
        // Show dashboard anyway, even with partial data
        document.querySelector('.loading-overlay')?.remove();
        document.querySelector('.content-wrapper')?.classList.add('page-active');
    }
});

/**
 * Initialize sidebar functionality
 */
function initSidebar() {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // Check for saved state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    }
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            
            // Save state
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    // Handle nav items click
    const navItems = document.querySelectorAll('.sidebar-nav li a');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // If it's a dropdown toggle, prevent default
            if (this.classList.contains('dropdown-toggle')) {
                this.parentElement.classList.toggle('expanded');
                return;
            }
            
            // Get the target page
            const targetPage = this.getAttribute('data-page');
            if (targetPage) {
                showPage(targetPage);
            }
            
            // Update active state
            navItems.forEach(navItem => {
                navItem.parentElement.classList.remove('active');
            });
            this.parentElement.classList.add('active');
            
            // On mobile, auto collapse sidebar
            if (window.innerWidth < 992) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
            }
        });
    });
    
    // Initialize logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
}

/**
 * Initialize notifications
 */
async function initNotifications() {
    // Get notification elements
    const notificationBtn = document.querySelector('.notification-btn');
    const notificationBadge = notificationBtn.querySelector('.badge');
    const notificationPanel = document.querySelector('#notificationPanel');
    const notificationList = notificationPanel.querySelector('.notification-list');
    const markAllReadBtn = notificationPanel.querySelector('.mark-all-read');
    
    // Fetch notifications
    const notifications = await apiRequest('/notifications');
    
    if (!notifications || notifications.length === 0) {
        // Hide badge if no notifications
        notificationBadge.classList.add('hidden');
        
        // Show empty state
        notificationList.innerHTML = `
            <div class="notification-item" style="justify-content: center;">
                <p style="text-align: center; color: var(--text-medium); padding: 20px;">
                    No notifications to display
                </p>
            </div>
        `;
        return;
    }
    
    // Count unread notifications
    const unreadCount = notifications.filter(notification => !notification.isRead).length;
    
    // Update badge
    if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        notificationBadge.classList.remove('hidden');
    } else {
        notificationBadge.classList.add('hidden');
    }
    
    // Clear notification list
    notificationList.innerHTML = '';
    
    // Add notifications to list (limit to 5 most recent)
    notifications.slice(0, 5).forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item${notification.isRead ? '' : ' unread'}`;
        
        // Determine icon based on notification type
        let iconClass, bgColor;
        switch (notification.type) {
            case 'appointment':
                iconClass = 'fa-calendar-check';
                bgColor = 'var(--bg-primary)';
                break;
            case 'medication':
                iconClass = 'fa-pills';
                bgColor = 'var(--bg-success)';
                break;
            case 'lab':
                iconClass = 'fa-flask';
                bgColor = 'var(--bg-info)';
                break;
            case 'message':
                iconClass = 'fa-envelope';
                bgColor = 'var(--bg-warning)';
                break;
            default:
                iconClass = 'fa-bell';
                bgColor = 'var(--bg-danger)';
        }
        
        // Format time
        const notificationTime = formatRelativeTime(new Date(notification.createdAt));
        
        item.innerHTML = `
            <div class="notification-icon" style="background-color: ${bgColor}">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="notification-content">
                <p>${notification.message}</p>
                <span class="notification-time">${notificationTime}</span>
            </div>
        `;
        
        notificationList.appendChild(item);
    });
    
    // Add event listeners
    notificationBtn.addEventListener('click', function(e) {
        e.preventDefault();
        notificationPanel.classList.toggle('show');
    });
    
    // Close when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationBtn.contains(e.target) && !notificationPanel.contains(e.target)) {
            notificationPanel.classList.remove('show');
        }
    });
    
    // Mark all as read
    markAllReadBtn.addEventListener('click', async function() {
        await apiRequest('/notifications/mark-read', 'POST');
        
        // Update UI
        notificationBadge.classList.add('hidden');
        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
        });
        
        showNotification('All notifications marked as read', 'success');
    });
}

/**
 * Format relative time for notifications
 */
function formatRelativeTime(date) {
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 60) {
        return 'Just now';
    }
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
}

/**
 * Initialize charts
 */
function initCharts(metrics) {
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not available. Charts will not be rendered.');
        return;
    }
    
    if (!metrics || Object.keys(metrics).length === 0) {
        console.warn('No health metrics data available');
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            container.innerHTML = '<div class="no-data-message">No health data available. Track your health metrics to see trends here.</div>';
        });
        return;
    }
    
    // Blood Pressure Chart
    if (metrics.bloodPressure && metrics.bloodPressure.length > 0) {
        const bpCtx = document.getElementById('bloodPressureChart');
        if (bpCtx) {
            const dates = metrics.bloodPressure.map(item => new Date(item.date).toLocaleDateString());
            const systolic = metrics.bloodPressure.map(item => item.values.systolic);
            const diastolic = metrics.bloodPressure.map(item => item.values.diastolic);
            
            new Chart(bpCtx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Systolic',
                            data: systolic,
                            borderColor: '#4361ee',
                            backgroundColor: 'rgba(67, 97, 238, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Diastolic',
                            data: diastolic,
                            borderColor: '#3f37c9',
                            backgroundColor: 'rgba(63, 55, 201, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: Math.min(...diastolic) - 10,
                            max: Math.max(...systolic) + 10,
                            title: {
                                display: true,
                                text: 'mmHg'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                title: function(tooltipItems) {
                                    return `Blood Pressure on ${tooltipItems[0].label}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } else {
        const bpContainer = document.getElementById('bloodPressureChart')?.closest('.chart-container');
        if (bpContainer) {
            bpContainer.innerHTML = '<div class="no-data-message">No blood pressure data available.</div>';
        }
    }
    
    // Blood Sugar Chart
    if (metrics.bloodSugar && metrics.bloodSugar.length > 0) {
        const bsCtx = document.getElementById('bloodSugarChart');
        if (bsCtx) {
            const dates = metrics.bloodSugar.map(item => new Date(item.date).toLocaleDateString());
            const values = metrics.bloodSugar.map(item => item.value);
            
            new Chart(bsCtx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Blood Sugar',
                            data: values,
                            borderColor: '#f72585',
                            backgroundColor: 'rgba(247, 37, 133, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: Math.min(...values) - 5,
                            max: Math.max(...values) + 5,
                            title: {
                                display: true,
                                text: 'mg/dL'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                title: function(tooltipItems) {
                                    return `Blood Sugar on ${tooltipItems[0].label}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } else {
        const bsContainer = document.getElementById('bloodSugarChart')?.closest('.chart-container');
        if (bsContainer) {
            bsContainer.innerHTML = '<div class="no-data-message">No blood sugar data available.</div>';
        }
    }
    
    // Weight Chart
    if (metrics.weight && metrics.weight.length > 0) {
        const weightCtx = document.getElementById('weightChart');
        if (weightCtx) {
            const dates = metrics.weight.map(item => new Date(item.date).toLocaleDateString());
            const values = metrics.weight.map(item => item.value);
            
            new Chart(weightCtx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Weight',
                            data: values,
                            borderColor: '#4CC9F0',
                            backgroundColor: 'rgba(76, 201, 240, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: Math.min(...values) - 2,
                            max: Math.max(...values) + 2,
                            title: {
                                display: true,
                                text: 'kg'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                title: function(tooltipItems) {
                                    return `Weight on ${tooltipItems[0].label}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } else {
        const weightContainer = document.getElementById('weightChart')?.closest('.chart-container');
        if (weightContainer) {
            weightContainer.innerHTML = '<div class="no-data-message">No weight data available.</div>';
        }
    }
}

/**
 * Initialize tab navigation
 */
function initTabNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav li a');
    const viewAllLinks = document.querySelectorAll('.view-all[data-page]');
    
    // Add click events to "View All" links
    viewAllLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            if (targetPage) {
                showPage(targetPage);
                
                // Update sidebar active state
                navLinks.forEach(navLink => {
                    const linkPage = navLink.getAttribute('data-page');
                    if (linkPage === targetPage) {
                        navLink.parentElement.classList.add('active');
                    } else {
                        navLink.parentElement.classList.remove('active');
                    }
                });
            }
        });
    });
}

/**
 * Initialize event listeners for buttons and actions
 */
function initEventListeners() {
    // Download Records button
    const downloadBtn = document.getElementById('downloadRecordsBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            showNotification('Preparing your records for download...', 'info');
            
            // Simulate download process
            setTimeout(() => {
                showNotification('Your records are ready for download', 'success');
                
                // In a real app, this would trigger a file download
                const link = document.createElement('a');
                link.href = '#'; // Would be a real file URL
                link.download = 'medical_records.pdf';
                // link.click(); // Commented out for demo
            }, 1500);
        });
    }
    
    // Save Appointment button
    const saveAppointmentBtn = document.getElementById('saveAppointmentBtn');
    if (saveAppointmentBtn) {
        saveAppointmentBtn.addEventListener('click', function() {
            const form = document.getElementById('appointmentForm');
            if (form) {
                // Simple validation
                const specialty = document.getElementById('specialtySelect').value;
                const doctor = document.getElementById('doctorSelect').value;
                const date = document.getElementById('appointmentDate').value;
                const time = document.getElementById('appointmentTime').value;
                
                if (!specialty || !doctor || !date || !time) {
                    showNotification('Please fill in all required fields', 'error');
                    return;
                }
                
                // Show loading
                this.disabled = true;
                this.textContent = 'Scheduling...';
                
                // Simulate API call
                setTimeout(() => {
                    showNotification('Appointment scheduled successfully!', 'success');
                    closeModal('appointmentModal');
                    
                    // Reset form and button
                    form.reset();
                    this.disabled = false;
                    this.textContent = 'Schedule Appointment';
                    
                    // Reload the page to show new appointment
                    // In a real app, you would update the UI directly
                    // location.reload();
                }, 1500);
            }
        });
    }
    
    // Specialty select to populate doctors
    const specialtySelect = document.getElementById('specialtySelect');
    const doctorSelect = document.getElementById('doctorSelect');
    
    if (specialtySelect && doctorSelect) {
        specialtySelect.addEventListener('change', function() {
            // Clear existing options
            doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
            
            // If no specialty selected, return
            if (!this.value) return;
            
            // Add doctors based on selected specialty
            const doctors = {
                cardiology: [
                    { id: 'c1', name: 'Dr. Robert Smith' },
                    { id: 'c2', name: 'Dr. Laura Chen' }
                ],
                dermatology: [
                    { id: 'd1', name: 'Dr. Sarah Johnson' },
                    { id: 'd2', name: 'Dr. Michael Brown' }
                ],
                neurology: [
                    { id: 'n1', name: 'Dr. David Wilson' },
                    { id: 'n2', name: 'Dr. Emily Davis' }
                ],
                orthopedics: [
                    { id: 'o1', name: 'Dr. James Miller' },
                    { id: 'o2', name: 'Dr. Patricia Clark' }
                ],
                pediatrics: [
                    { id: 'p1', name: 'Dr. Jessica Lee' },
                    { id: 'p2', name: 'Dr. John Anderson' }
                ],
                psychiatry: [
                    { id: 'ps1', name: 'Dr. Susan White' },
                    { id: 'ps2', name: 'Dr. Richard Moore' }
                ]
            };
            
            const selectedDoctors = doctors[this.value] || [];
            
            // Add doctor options
            selectedDoctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = doctor.name;
                doctorSelect.appendChild(option);
            });
        });
    }
    
    // Doctor select to populate available times
    const appointmentDate = document.getElementById('appointmentDate');
    const appointmentTime = document.getElementById('appointmentTime');
    
    if (appointmentDate && appointmentTime) {
        appointmentDate.addEventListener('change', function() {
            // Clear existing options
            appointmentTime.innerHTML = '<option value="">Select Time</option>';
            
            // If no date selected, return
            if (!this.value) return;
            
            // Add sample available times
            const times = [
                '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
                '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM',
                '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'
            ];
            
            // In a real app, these would be fetched from the server based on the doctor's availability
            
            // Add time options
            times.forEach(time => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                appointmentTime.appendChild(option);
            });
        });
    }
    
    // Modal close buttons
    const closeBtns = document.querySelectorAll('.modal-close, .btn-cancel');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Check if a notification container exists
    let container = document.querySelector('.notification-container');
    
    // If not, create one
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        </div>
        <div class="notification-content">
            <p>${message}</p>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add close button handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('removing');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Add to container
    container.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.add('removing');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Handle appointment actions
 */
function handleAppointment(action, id) {
    if (action === 'reschedule') {
        openModal('appointmentModal');
        showNotification('Please select a new date and time for your appointment', 'info');
    } else if (action === 'cancel') {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            showNotification('Your appointment has been cancelled', 'success');
            
            // In a real app, you would make an API call to cancel the appointment
            // and update the UI accordingly
        }
    }
}

/**
 * Show a specific page
 */
function showPage(pageId) {
    // Update page title
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        pageTitle.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1).replace('-', ' ');
    }
    
    // For now, we just ensure the dashboard page is active
    // In a full implementation, we would have multiple page divs and toggle them
    const contentWrapper = document.getElementById(pageId);
    if (contentWrapper) {
        document.querySelectorAll('.content-wrapper').forEach(wrapper => {
            wrapper.classList.remove('page-active');
        });
        contentWrapper.classList.add('page-active');
    } else {
        // If the page doesn't exist yet, show a message
        showNotification(`The ${pageId} page is under development`, 'info');
    }
}

/**
 * Open a modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

/**
 * Close a modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

/**
 * Fetch user data 
 */
async function fetchUserData() {
    try {
        // Get user info from local storage to determine userType
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo') || '{}');
        
        // Determine the correct endpoint based on user type
        let userData;
        
        if (userInfo.userType === 'patient') {
            // Fetch patient profile data
            userData = await apiRequest('/patients/profile');
        } else {
            // Fallback to generic profile endpoint if userType is undefined or not patient
            userData = await apiRequest('/auth/profile');
        }
        
        if (!userData) {
            console.error('Failed to fetch user data');
            return null;
        }
        
        // For backward compatibility, check if userData has a nested "user" property
        // Some API endpoints return { user: {...} } while others return the user data directly
        const profileData = userData.user || userData;
        
        // Update UI with user data
        updateUserProfile(profileData);
        
        // Store user data for later use
        localStorage.setItem('userData', JSON.stringify(profileData));
        
        return profileData;
    } catch (error) {
        console.error('Error fetching user data:', error);
        showNotification('Failed to load your profile data', 'error');
        return null;
    }
}

/**
 * Update user profile in UI
 */
function updateUserProfile(userData) {
    // Update username
    const usernameElements = document.querySelectorAll('.user-info h3');
    usernameElements.forEach(element => {
        element.textContent = userData.name || 'Patient';
    });
    
    // Update user image if available
    if (userData.profileImage) {
        const avatarImages = document.querySelectorAll('.avatar img');
        avatarImages.forEach(img => {
            img.src = userData.profileImage;
            img.alt = userData.name || 'Patient';
        });
    }
    
    // Update welcome message
    const welcomeMessage = document.querySelector('.welcome-message h3');
    if (welcomeMessage) {
        const greeting = getTimeBasedGreeting();
        welcomeMessage.textContent = `${greeting}, ${userData.name.split(' ')[0] || 'Patient'}`;
    }
    
    // Update dashboard with patient-specific information
    if (userData.medicalId) {
        const medicalIdElements = document.querySelectorAll('.medical-id');
        medicalIdElements.forEach(element => {
            element.textContent = userData.medicalId;
        });
    }
    
    // Update emergency card information
    const emergencyCardElements = document.querySelectorAll('.emergency-card');
    if (emergencyCardElements.length > 0 && userData) {
        // Set basic information
        const patientInfoContainers = document.querySelectorAll('.patient-info');
        patientInfoContainers.forEach(container => {
            container.innerHTML = `
                <div class="info-group">
                    <label>Patient ID:</label>
                    <span>${userData.medicalId || 'Not assigned'}</span>
                </div>
                <div class="info-group">
                    <label>Full Name:</label>
                    <span>${userData.name || 'Not available'}</span>
                </div>
                <div class="info-group">
                    <label>Date of Birth:</label>
                    <span>${userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : 'Not available'}</span>
                </div>
                <div class="info-group">
                    <label>Blood Type:</label>
                    <span>${userData.bloodType || 'Not available'}</span>
                </div>
                <div class="info-group">
                    <label>Allergies:</label>
                    <span>${userData.allergies && userData.allergies.length ? userData.allergies.join(', ') : 'None recorded'}</span>
                </div>
                <div class="info-group">
                    <label>Emergency Contact:</label>
                    <span>${userData.emergencyContact?.name || 'Not available'} ${userData.emergencyContact?.phone ? `(${userData.emergencyContact.phone})` : ''}</span>
                </div>
            `;
        });
    }
}

/**
 * Get time-based greeting
 */
function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

/**
 * Logout user
 */
async function logoutUser(force = false) {
    if (force || confirm('Are you sure you want to log out?')) {
        try {
            showNotification('Logging you out...', 'info');
            
            // Try to call logout API to invalidate token on server
            await apiRequest('/auth/logout', 'POST')
                .catch(error => {
                    console.warn('Logout API call failed:', error);
                    // Continue with client-side logout even if API call fails
                });
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with local logout even if there was an error
        } finally {
            // Clear all auth data
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('userData');
            
            // Clear session storage as well
            sessionStorage.removeItem('userInfo');
            sessionStorage.removeItem('userData');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = '../../login/';
            }, 1000);
        }
    }
}

/**
 * Initialize search functionality
 */
function initSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            // Check if Enter key was pressed
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    performSearch(query);
                }
            }
        });
    }
}

/**
 * Perform search across patient data
 */
function performSearch(query) {
    showNotification(`Searching for "${query}"...`, 'info');
    
    // Simulate search loading
    setTimeout(() => {
        // In a real app, this would search through actual data
        // For demo, we'll show a results modal
        showSearchResults(query);
    }, 500);
}

/**
 * Show search results in a modal
 */
function showSearchResults(query) {
    // Create modal if it doesn't exist
    if (!document.getElementById('searchResultsModal')) {
        const modal = document.createElement('div');
        modal.id = 'searchResultsModal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Search Results</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="search-info">
                        <p>Showing results for: <strong id="searchQuery"></strong></p>
                    </div>
                    <div id="searchResultsContainer" class="search-results-container">
                        <!-- Results will be inserted here -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline btn-cancel">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners to close buttons
        const closeBtns = modal.querySelectorAll('.modal-close, .btn-cancel');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                closeModal('searchResultsModal');
            });
        });
    }
    
    // Update search query display
    document.getElementById('searchQuery').textContent = query;
    
    // Generate sample results
    const resultsContainer = document.getElementById('searchResultsContainer');
    if (resultsContainer) {
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        // Example results - in a real app, these would be actual search results
        const sampleResults = [
            {
                type: 'medical-record',
                title: 'Annual Physical Examination',
                date: 'Jan 15, 2023',
                provider: 'Dr. Robert Smith',
                icon: 'fa-file-medical'
            },
            {
                type: 'prescription',
                title: 'Atorvastatin 20mg',
                date: 'Jan 15, 2023',
                provider: 'Dr. Robert Smith',
                icon: 'fa-prescription'
            },
            {
                type: 'lab-report',
                title: 'Complete Blood Count',
                date: 'Apr 10, 2023',
                provider: 'City Hospital',
                icon: 'fa-flask'
            },
            {
                type: 'appointment',
                title: 'Cardiology Follow-up',
                date: 'May 15, 2023',
                provider: 'Dr. Robert Smith',
                icon: 'fa-calendar-check'
            }
        ];
        
        // Filter results that might match the query (case insensitive)
        const filteredResults = sampleResults.filter(result => 
            result.title.toLowerCase().includes(query.toLowerCase()) || 
            result.provider.toLowerCase().includes(query.toLowerCase())
        );
        
        if (filteredResults.length > 0) {
            // Create result items
            filteredResults.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <div class="result-icon bg-${result.type === 'medical-record' ? 'info' : 
                                         result.type === 'prescription' ? 'success' : 
                                         result.type === 'lab-report' ? 'warning' : 'primary'}">
                        <i class="fas ${result.icon}"></i>
                    </div>
                    <div class="result-content">
                        <h4>${result.title}</h4>
                        <p>${result.date} | ${result.provider}</p>
                    </div>
                    <div class="result-action">
                        <button class="btn btn-sm btn-outline">View</button>
                    </div>
                `;
                
                resultsContainer.appendChild(resultItem);
                
                // Add click event to view button
                const viewBtn = resultItem.querySelector('.result-action button');
                viewBtn.addEventListener('click', function() {
                    closeModal('searchResultsModal');
                    showNotification(`Viewing ${result.title}`, 'info');
                    
                    // In a real app, this would navigate to the specific record
                    if (result.type === 'appointment') {
                        showPage('appointments');
                    } else if (result.type === 'prescription') {
                        showPage('prescriptions');
                    } else if (result.type === 'lab-report') {
                        showPage('lab-reports');
                    } else if (result.type === 'medical-record') {
                        showPage('medical-records');
                    }
                });
            });
        } else {
            // No results found
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search fa-3x"></i>
                    <p>No results found for "${query}"</p>
                    <p class="suggestion">Try using different keywords or check for spelling errors.</p>
                </div>
            `;
        }
    }
    
    // Open the modal
    openModal('searchResultsModal');
}

/**
 * Initialize emergency card functionality
 */
async function initEmergencyCard() {
    // Get emergency card elements
    const emergencyCardSection = document.querySelector('.emergency-card-section');
    if (!emergencyCardSection) return;
    
    // Get elements
    const cardStatusEl = document.querySelector('.emergency-card .status');
    const qrCodeContainer = document.querySelector('.qr-code');
    const expiresEl = document.querySelector('.expires');
    const regenerateBtn = document.querySelector('#regenerateCard');
    const toggleCardBtn = document.querySelector('#toggleCardStatus');
    const downloadBtn = document.querySelector('#downloadCard');
    const accessLogsTable = document.querySelector('.access-logs-table tbody');
    
    try {
        // Fetch emergency card data
        const cardData = await apiRequest('/emergency-card');
        
        if (!cardData || Object.keys(cardData).length === 0) {
            // Card doesn't exist, try to create a new one
            try {
                showNotification('Creating your emergency card...', 'info');
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                
                // Prepare payload with user data if available
                const payload = {};
                if (userData.emergencyContact) {
                    payload.emergencyContact = userData.emergencyContact;
                }
                if (userData.allergies) {
                    payload.allergies = userData.allergies;
                }
                if (userData.chronicConditions) {
                    payload.medicalConditions = userData.chronicConditions;
                }
                
                const newCard = await apiRequest('/emergency-card', 'POST', payload);
                if (newCard) {
                    updateEmergencyCardUI(newCard);
                    showNotification('Emergency card created successfully', 'success');
                } else {
                    showNotification('Failed to create emergency card', 'error');
                }
            } catch (createError) {
                console.error('Error creating emergency card:', createError);
                showNotification('Unable to create emergency card', 'error');
            }
        } else {
            // Update UI with existing card data
            updateEmergencyCardUI(cardData);
        }
        
        // Regenerate card handler
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', async function() {
                if (confirm('Are you sure you want to regenerate your emergency card? This will invalidate the current QR code.')) {
                    try {
                        const newCard = await apiRequest('/emergency-card/regenerate', 'POST');
                        if (newCard) {
                            updateEmergencyCardUI(newCard);
                            showNotification('Emergency card regenerated successfully', 'success');
                        } else {
                            showNotification('Failed to regenerate emergency card', 'error');
                        }
                    } catch (regenerateError) {
                        console.error('Error regenerating emergency card:', regenerateError);
                        showNotification('Failed to regenerate emergency card', 'error');
                    }
                }
            });
        }
        
        // Toggle card status handler
        if (toggleCardBtn) {
            toggleCardBtn.addEventListener('change', async function() {
                const isActive = this.checked;
                try {
                    const status = await apiRequest('/emergency-card/status', 'PATCH', { isActive });
                    
                    if (status) {
                        // Update UI
                        if (cardStatusEl) {
                            cardStatusEl.textContent = isActive ? 'ACTIVE' : 'INACTIVE';
                            cardStatusEl.className = `status ${isActive ? 'active' : 'inactive'}`;
                        }
                        
                        // Update status text
                        const statusTextEl = document.querySelector('#cardActiveStatus');
                        if (statusTextEl) {
                            statusTextEl.textContent = isActive ? 'Active' : 'Inactive';
                        }
                        
                        showNotification(`Emergency card ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
                    } else {
                        // Revert toggle if failed
                        this.checked = !isActive;
                        showNotification('Failed to update emergency card status', 'error');
                    }
                } catch (statusError) {
                    console.error('Error updating emergency card status:', statusError);
                    this.checked = !isActive; // Revert toggle
                    showNotification('Failed to update emergency card status', 'error');
                }
            });
        }
        
        // Download card handler
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                showNotification('Emergency card PDF is being generated...', 'info');
                
                // In a real implementation, this would download a PDF
                setTimeout(() => {
                    showNotification('Emergency card downloaded successfully', 'success');
                }, 1500);
            });
        }
        
        // Load access logs
        if (accessLogsTable) {
            await loadAccessLogs(accessLogsTable);
        }
    } catch (error) {
        console.error('Error initializing emergency card:', error);
        showNotification('Failed to load emergency card', 'error');
    }
}

/**
 * Update emergency card UI
 */
function updateEmergencyCardUI(cardData) {
    // Update card status
    const cardStatusEl = document.querySelector('.emergency-card .status');
    if (cardStatusEl) {
        cardStatusEl.textContent = cardData.isActive ? 'ACTIVE' : 'INACTIVE';
        cardStatusEl.className = `status ${cardData.isActive ? 'active' : 'inactive'}`;
    }
    
    // Update toggle switch
    const toggleCardBtn = document.querySelector('#toggleCardStatus');
    if (toggleCardBtn) {
        toggleCardBtn.checked = cardData.isActive;
        
        const statusTextEl = document.querySelector('#cardActiveStatus');
        if (statusTextEl) {
            statusTextEl.textContent = cardData.isActive ? 'Active' : 'Inactive';
        }
    }
    
    // Update QR code
    const qrCodeContainer = document.querySelector('.qr-code');
    if (qrCodeContainer && cardData.qrCodeUrl) {
        qrCodeContainer.innerHTML = `<img src="${cardData.qrCodeUrl}" alt="Emergency Access QR Code">`;
    }
    
    // Update expiration date
    const expiresEl = document.querySelector('.expires');
    if (expiresEl && cardData.expiresAt) {
        const expiryDate = new Date(cardData.expiresAt);
        const now = new Date();
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        expiresEl.textContent = `Expires in ${daysLeft} days (${expiryDate.toLocaleDateString()})`;
    }
}

/**
 * Load access logs
 */
async function loadAccessLogs(tableElement) {
    if (!tableElement) return;
    
    // Show loading
    tableElement.innerHTML = '<tr><td colspan="4" class="loading">Loading access logs...</td></tr>';
    
    // Fetch access logs
    const logs = await apiRequest('/emergency-card/access-logs');
    
    if (!logs || logs.length === 0) {
        tableElement.innerHTML = '<tr><td colspan="4" class="no-records">No access logs found</td></tr>';
        return;
    }
    
    // Clear table
    tableElement.innerHTML = '';
    
    // Add logs to table
    logs.forEach(log => {
        const row = document.createElement('tr');
        
        const accessDate = new Date(log.accessedAt);
        const formattedDate = accessDate.toLocaleDateString();
        const formattedTime = accessDate.toLocaleTimeString();
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td>${log.accessedBy || 'Unknown'}</td>
            <td>${log.accessedFrom || 'Unknown location'}</td>
        `;
        
        tableElement.appendChild(row);
    });
}

/**
 * Fetch patient appointments
 */
async function fetchAppointments() {
    try {
        const appointments = await apiRequest('/appointments');
        
        if (!appointments || !Array.isArray(appointments)) {
            console.warn('No appointments data received or invalid format');
            return [];
        }
        
        // Update dashboard upcoming appointments
        const appointmentList = document.querySelector('.appointment-list');
        if (appointmentList) {
            appointmentList.innerHTML = '';
            
            // Sort appointments by date
            appointments.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Show only future appointments, limited to 3 for the dashboard
            const upcomingAppointments = appointments
                .filter(apt => new Date(apt.date) >= new Date())
                .slice(0, 3);
            
            if (upcomingAppointments.length === 0) {
                appointmentList.innerHTML = '<div class="no-records">No upcoming appointments</div>';
            } else {
                upcomingAppointments.forEach(appointment => {
                    const appointmentDate = new Date(appointment.date);
                    const formattedMonth = appointmentDate.toLocaleString('default', { month: 'short' });
                    const formattedDay = appointmentDate.getDate();
                    
                    const appointmentItem = document.createElement('div');
                    appointmentItem.className = 'appointment-item';
                    
                    // Safely access nested properties
                    const doctorName = appointment.doctorName || 'Doctor';
                    const specialization = appointment.specialization || appointment.doctorSpecialization || 'Specialist';
                    const appointmentType = appointment.type || appointment.appointmentType || 'Consultation';
                    const hospitalName = appointment.hospitalName || appointment.location || 'Hospital';
                    
                    appointmentItem.innerHTML = `
                        <div class="appointment-date">
                            <div class="date-display">
                                <span class="month">${formattedMonth}</span>
                                <span class="day">${formattedDay}</span>
                            </div>
                            <span class="time">${appointment.time || '00:00'}</span>
                        </div>
                        <div class="appointment-details">
                            <h4>${doctorName}</h4>
                            <p>${specialization} - ${appointmentType}</p>
                            <p class="location"><i class="fas fa-map-marker-alt"></i> ${hospitalName}</p>
                        </div>
                        <div class="appointment-actions">
                            <button class="btn btn-sm btn-outline" onclick="handleAppointment('reschedule', '${appointment._id}')">Reschedule</button>
                            <button class="btn btn-sm btn-outline btn-danger" onclick="handleAppointment('cancel', '${appointment._id}')">Cancel</button>
                        </div>
                    `;
                    
                    appointmentList.appendChild(appointmentItem);
                });
            }
            
            // Update stat card
            const appointmentCount = document.querySelector('.stat-card:nth-child(1) .stat-value');
            if (appointmentCount) {
                const futureAppointments = appointments.filter(apt => new Date(apt.date) >= new Date());
                appointmentCount.textContent = futureAppointments.length;
                
                // Update next appointment detail
                const appointmentDetail = document.querySelector('.stat-card:nth-child(1) .stat-detail');
                if (appointmentDetail && futureAppointments.length > 0) {
                    const nextAppointment = futureAppointments[0];
                    const nextDate = new Date(nextAppointment.date);
                    const doctorLastName = (nextAppointment.doctorName || 'Doctor').split(' ').pop();
                    appointmentDetail.textContent = `Next: Dr. ${doctorLastName} on ${nextDate.toLocaleString('default', { month: 'short' })} ${nextDate.getDate()}`;
                } else if (appointmentDetail) {
                    appointmentDetail.textContent = 'No upcoming appointments';
                }
            }
        }
        
        return appointments;
    } catch (error) {
        console.error('Error fetching appointments:', error);
        showNotification('Failed to load appointments', 'error');
        return [];
    }
}

/**
 * Handle appointment actions
 */
async function handleAppointment(action, id) {
    if (action === 'reschedule') {
        // Get appointment details
        const appointment = await apiRequest(`/appointments/${id}`);
        
        if (appointment) {
            // Pre-fill the appointment form
            const doctorSelect = document.getElementById('doctorSelect');
            const dateInput = document.getElementById('appointmentDate');
            const timeSelect = document.getElementById('appointmentTime');
            const reasonTextarea = document.getElementById('appointmentReason');
            
            if (doctorSelect) doctorSelect.value = appointment.doctorId;
            if (dateInput) dateInput.value = new Date(appointment.date).toISOString().split('T')[0];
            if (timeSelect) timeSelect.value = appointment.time;
            if (reasonTextarea) reasonTextarea.value = appointment.reason || '';
            
            // Set form attribute for reschedule
            const appointmentForm = document.getElementById('appointmentForm');
            if (appointmentForm) {
                appointmentForm.setAttribute('data-appointment-id', id);
                appointmentForm.setAttribute('data-action', 'reschedule');
            }
            
            // Show modal
            openModal('appointmentModal');
            
            // Update modal title and button
            const modalTitle = document.querySelector('#appointmentModal .modal-header h3');
            const saveButton = document.getElementById('saveAppointmentBtn');
            
            if (modalTitle) modalTitle.textContent = 'Reschedule Appointment';
            if (saveButton) saveButton.textContent = 'Update Appointment';
            
            showNotification('Please select a new date and time for your appointment', 'info');
        }
    } else if (action === 'cancel') {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            const result = await apiRequest(`/appointments/${id}/cancel`, 'PUT');
            
            if (result) {
                showNotification('Your appointment has been cancelled', 'success');
                // Refresh appointments
                fetchAppointments();
            }
        }
    }
}

/**
 * Save appointment (create or reschedule)
 */
async function saveAppointment(form) {
    // Get form data
    const doctorId = document.getElementById('doctorSelect').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const reason = document.getElementById('appointmentReason').value;
    
    // Validate required fields
    if (!doctorId || !date || !time) {
        showNotification('Please fill in all required fields', 'error');
        return false;
    }
    
    // Check if date is in the future
    const appointmentDate = new Date(`${date}T${time}`);
    if (appointmentDate <= new Date()) {
        showNotification('Appointment date must be in the future', 'error');
        return false;
    }
    
    // Get form action and appointment ID
    const action = form.getAttribute('data-action') || 'create';
    const appointmentId = form.getAttribute('data-appointment-id');
    
    // Prepare the appointment payload
    const appointmentData = {
        doctorId,
        date,
        time,
        reason: reason || 'Routine checkup'
    };
    
    try {
        let result;
        
        if (action === 'reschedule' && appointmentId) {
            // Update existing appointment
            showNotification('Updating your appointment...', 'info');
            result = await apiRequest(`/appointments/${appointmentId}`, 'PUT', appointmentData);
            
            if (result) {
                showNotification('Appointment rescheduled successfully!', 'success');
            }
        } else {
            // Create new appointment
            showNotification('Scheduling your appointment...', 'info');
            result = await apiRequest('/appointments', 'POST', appointmentData);
            
            if (result) {
                showNotification('Appointment scheduled successfully!', 'success');
            }
        }
        
        // Close modal and refresh data
        closeModal('appointmentModal');
        form.reset();
        await fetchAppointments();
        
        return true;
    } catch (error) {
        console.error('Appointment save error:', error);
        showNotification('Failed to save appointment. Please try again.', 'error');
        return false;
    }
}

/**
 * Initialize appointment form event listeners
 */
function initAppointmentForm() {
    const saveAppointmentBtn = document.getElementById('saveAppointmentBtn');
    const appointmentForm = document.getElementById('appointmentForm');
    
    if (saveAppointmentBtn && appointmentForm) {
        saveAppointmentBtn.addEventListener('click', async function() {
            // Show loading state
            this.disabled = true;
            this.textContent = 'Saving...';
            
            const success = await saveAppointment(appointmentForm);
            
            if (!success) {
                // Reset button if unsuccessful
                this.disabled = false;
                this.textContent = 'Schedule Appointment';
            }
        });
    }
}

/**
 * Update medications list with prescription data
 */
function updateMedicationsList(prescriptions) {
    const medicationsList = document.querySelector('.medications-list');
    if (!medicationsList) return;
    
    // Clear list
    medicationsList.innerHTML = '';
    
    if (!prescriptions || !Array.isArray(prescriptions) || prescriptions.length === 0) {
        medicationsList.innerHTML = '<div class="no-records">No active medications</div>';
        return;
    }
    
    try {
        // Sort prescriptions by date (newest first)
        prescriptions.sort((a, b) => new Date(b.prescribedDate) - new Date(a.prescribedDate));
        
        // Only display active prescriptions
        const activePrescriptions = prescriptions.filter(p => 
            p.status === 'active' || 
            (p.endDate && new Date(p.endDate) >= new Date())
        );
        
        if (activePrescriptions.length === 0) {
            medicationsList.innerHTML = '<div class="no-records">No active medications</div>';
            return;
        }
        
        // Update the stat card count
        const medicationCount = document.querySelector('.stat-card:nth-child(2) .stat-value');
        if (medicationCount) {
            medicationCount.textContent = activePrescriptions.length;
        }
        
        // Add each medication to the list
        activePrescriptions.forEach(prescription => {
            const medicationItem = document.createElement('div');
            medicationItem.className = 'medication-item';
            
            // Extract data safely with fallbacks
            const medication = prescription.medication || {};
            const medicationName = medication.name || prescription.medicationName || 'Medication';
            const dosage = medication.dosage || prescription.dosage || '';
            const frequency = medication.frequency || prescription.frequency || 'As needed';
            const instructions = prescription.instructions || '';
            const doctorName = prescription.doctorName || 'Your doctor';
            
            // Format dates
            const startDate = prescription.startDate ? new Date(prescription.startDate).toLocaleDateString() : 'N/A';
            const endDate = prescription.endDate ? new Date(prescription.endDate).toLocaleDateString() : 'Ongoing';
            
            // Build medication item HTML
            medicationItem.innerHTML = `
                <div class="medication-info">
                    <h4>${medicationName}</h4>
                    <p class="dosage">${dosage} ${frequency}</p>
                    <p class="instructions">${instructions}</p>
                    <p class="prescription-details">
                        <span>Prescribed by ${doctorName}</span>
                        <span>Valid: ${startDate} to ${endDate}</span>
                    </p>
                </div>
                <div class="medication-actions">
                    <button class="btn btn-sm btn-outline" onclick="showMedicationDetails('${prescription._id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            `;
            
            medicationsList.appendChild(medicationItem);
        });
        
        // Add a global function to show medication details
        window.showMedicationDetails = function(id) {
            // This function would be implemented to show a modal with details
            // For now, just show a notification
            showNotification('Medication details functionality coming soon', 'info');
        };
    } catch (error) {
        console.error('Error updating medications list:', error);
        medicationsList.innerHTML = '<div class="error-message">Could not load medications list</div>';
    }
} 