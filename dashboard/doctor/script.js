document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard functionality
    initSidebar();
    initNotifications();
    initCharts();
    initTabNavigation();
    initModalControls();
    initPatientSearch();
    
    // Add event listeners for various functions
    document.getElementById('saveAppointmentBtn')?.addEventListener('click', saveAppointment);
    document.getElementById('startConsultationBtn')?.addEventListener('click', startNewConsultation);
    
    // Initialize tab controls in modals
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show selected tab content
            const targetId = this.getAttribute('data-tab');
            document.getElementById(targetId)?.classList.remove('hidden');
        });
    });
    
    // Show dashboard content (simulate loading)
    setTimeout(() => {
        document.querySelector('.loading-overlay')?.classList.add('hidden');
        document.querySelector('.dashboard-content')?.classList.remove('hidden');
    }, 500);
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
            // If it's a dropdown toggle, prevent default
            if (this.classList.contains('dropdown-toggle')) {
                e.preventDefault();
                this.parentElement.classList.toggle('expanded');
                return;
            }
            
            // Otherwise proceed with navigation
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
}

/**
 * Initialize notifications
 */
function initNotifications() {
    const notificationBtn = document.querySelector('.notification-btn');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Create notification panel dynamically if it doesn't exist
            let notificationPanel = document.querySelector('.notification-panel');
            
            if (!notificationPanel) {
                notificationPanel = document.createElement('div');
                notificationPanel.className = 'notification-panel dropdown-panel';
                notificationPanel.innerHTML = `
                    <div class="panel-header">
                        <h3>Notifications</h3>
                        <button class="mark-all-read">Mark all as read</button>
                    </div>
                    <div class="notification-list">
                        <div class="notification-item unread">
                            <div class="notification-icon"><i class="fas fa-user-injured"></i></div>
                            <div class="notification-content">
                                <h4>New Patient Assigned</h4>
                                <p>Meera Reddy has been assigned to you</p>
                                <span class="notification-time">5 minutes ago</span>
                            </div>
                        </div>
                        <div class="notification-item unread">
                            <div class="notification-icon"><i class="fas fa-calendar-alt"></i></div>
                            <div class="notification-content">
                                <h4>Appointment Reminder</h4>
                                <p>You have a video consultation in 30 minutes</p>
                                <span class="notification-time">30 minutes ago</span>
                            </div>
                        </div>
                        <div class="notification-item unread">
                            <div class="notification-icon"><i class="fas fa-file-medical"></i></div>
                            <div class="notification-content">
                                <h4>Lab Results Available</h4>
                                <p>New lab results for Vikram Malhotra</p>
                                <span class="notification-time">1 hour ago</span>
                            </div>
                        </div>
                        <div class="notification-item">
                            <div class="notification-icon"><i class="fas fa-comment-medical"></i></div>
                            <div class="notification-content">
                                <h4>New Message</h4>
                                <p>Dr. Gupta sent you a message about a patient</p>
                                <span class="notification-time">Yesterday</span>
                            </div>
                        </div>
                        <div class="notification-item">
                            <div class="notification-icon"><i class="fas fa-rupee-sign"></i></div>
                            <div class="notification-content">
                                <h4>Payment Received</h4>
                                <p>You received a payment of ₹1,500</p>
                                <span class="notification-time">Yesterday</span>
                            </div>
                        </div>
                    </div>
                    <div class="panel-footer">
                        <a href="#" class="view-all-link">View all notifications</a>
                    </div>
                `;
                document.body.appendChild(notificationPanel);
                
                // Mark all as read functionality
                const markReadBtn = notificationPanel.querySelector('.mark-all-read');
                if (markReadBtn) {
                    markReadBtn.addEventListener('click', function() {
                        notificationPanel.querySelectorAll('.notification-item.unread').forEach(item => {
                            item.classList.remove('unread');
                        });
                        
                        // Update badge
                        const badge = notificationBtn.querySelector('.badge');
                        if (badge) {
                            badge.textContent = '0';
                            badge.classList.add('hidden');
                        }
                    });
                }
            }
            
            notificationPanel.classList.toggle('show');
            
            // Close when clicking outside
            document.addEventListener('click', function closePanel(e) {
                if (!notificationPanel.contains(e.target) && e.target !== notificationBtn) {
                    notificationPanel.classList.remove('show');
                    document.removeEventListener('click', closePanel);
                }
            });
        });
    }
}

/**
 * Initialize charts
 */
function initCharts() {
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not available. Charts will not be rendered.');
        return;
    }
    
    // Performance Chart
    const performanceChartEl = document.getElementById('performanceChart');
    if (performanceChartEl) {
        const performanceChart = new Chart(performanceChartEl, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Appointments',
                        data: [12, 15, 18, 14, 11, 8, 4],
                        backgroundColor: 'rgba(25, 118, 210, 0.7)',
                        borderColor: 'rgba(25, 118, 210, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Consultations',
                        data: [8, 12, 14, 10, 8, 5, 2],
                        backgroundColor: 'rgba(76, 175, 80, 0.7)',
                        borderColor: 'rgba(76, 175, 80, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Count'
                        }
                    }
                }
            }
        });
    }
}

/**
 * Initialize tab navigation
 */
function initTabNavigation() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const contentWrappers = document.querySelectorAll('.content-wrapper');
    
    if (tabLinks.length && contentWrappers.length) {
        tabLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all tabs
                tabLinks.forEach(tab => tab.parentElement.classList.remove('active'));
                
                // Add active class to current tab
                this.parentElement.classList.add('active');
                
                // Hide all content wrappers
                contentWrappers.forEach(wrapper => {
                    wrapper.classList.remove('page-active');
                });
                
                // Show the target content wrapper
                const target = this.getAttribute('data-target');
                if (target) {
                    document.getElementById(target)?.classList.add('page-active');
                    
                    // Update page title
                    const pageTitle = document.querySelector('.page-title');
                    if (pageTitle) {
                        pageTitle.textContent = this.querySelector('span').textContent || 'Dashboard';
                    }
                    
                    // Store active tab in localStorage
                    localStorage.setItem('activeDoctorTab', target);
                }
            });
        });
        
        // Check for saved active tab
        const activeTab = localStorage.getItem('activeDoctorTab');
        if (activeTab) {
            const savedTab = document.querySelector(`.tab-link[data-target="${activeTab}"]`);
            if (savedTab) {
                savedTab.click();
            } else {
                // Default to first tab
                tabLinks[0]?.click();
            }
        } else {
            // Default to first tab
            tabLinks[0]?.click();
        }
    }
}

/**
 * Initialize modal controls
 */
function initModalControls() {
    // Get all close buttons
    const closeBtns = document.querySelectorAll('.modal-close, .btn-cancel');
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Close modal when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
}

/**
 * Initialize patient search
 */
function initPatientSearch() {
    const patientSearchInput = document.getElementById('patientSearch');
    const consultPatientSearchInput = document.getElementById('consultPatientSearch');
    const patientSearchResults = document.getElementById('patientSearchResults');
    const consultPatientSearchResults = document.getElementById('consultPatientSearchResults');
    
    // Sample patient data
    const patients = [
        { id: 101, name: 'Aarav Patel', age: 42, gender: 'Male', phone: '+91 98765 43210' },
        { id: 102, name: 'Priya Singh', age: 35, gender: 'Female', phone: '+91 87654 32109' },
        { id: 103, name: 'Vikram Malhotra', age: 58, gender: 'Male', phone: '+91 76543 21098' },
        { id: 104, name: 'Meera Reddy', age: 29, gender: 'Female', phone: '+91 65432 10987' },
        { id: 105, name: 'Rajiv Kumar', age: 47, gender: 'Male', phone: '+91 54321 09876' }
    ];
    
    // Add event listener for appointment patient search
    if (patientSearchInput && patientSearchResults) {
        patientSearchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            
            if (query.length < 2) {
                patientSearchResults.innerHTML = '';
                patientSearchResults.classList.remove('show');
                return;
            }
            
            // Filter patients
            const filteredPatients = patients.filter(patient => 
                patient.name.toLowerCase().includes(query) || 
                patient.id.toString().includes(query)
            );
            
            // Show results
            patientSearchResults.innerHTML = '';
            
            if (filteredPatients.length > 0) {
                filteredPatients.forEach(patient => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'search-result-item';
                    resultItem.innerHTML = `
                        <div class="patient-name">${patient.name}</div>
                        <div class="patient-meta">${patient.age} years, ${patient.gender} | ID: ${patient.id}</div>
                    `;
                    
                    resultItem.addEventListener('click', function() {
                        patientSearchInput.value = patient.name;
                        patientSearchInput.dataset.patientId = patient.id;
                        patientSearchResults.classList.remove('show');
                    });
                    
                    patientSearchResults.appendChild(resultItem);
                });
                
                patientSearchResults.classList.add('show');
            } else {
                patientSearchResults.innerHTML = '<div class="no-results">No patients found</div>';
                patientSearchResults.classList.add('show');
            }
        });
        
        // Close search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!patientSearchInput.contains(e.target) && !patientSearchResults.contains(e.target)) {
                patientSearchResults.classList.remove('show');
            }
        });
    }
    
    // Add event listener for consultation patient search
    if (consultPatientSearchInput && consultPatientSearchResults) {
        consultPatientSearchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            
            if (query.length < 2) {
                consultPatientSearchResults.innerHTML = '';
                consultPatientSearchResults.classList.remove('show');
                return;
            }
            
            // Filter patients
            const filteredPatients = patients.filter(patient => 
                patient.name.toLowerCase().includes(query) || 
                patient.id.toString().includes(query)
            );
            
            // Show results
            consultPatientSearchResults.innerHTML = '';
            
            if (filteredPatients.length > 0) {
                filteredPatients.forEach(patient => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'search-result-item';
                    resultItem.innerHTML = `
                        <div class="patient-name">${patient.name}</div>
                        <div class="patient-meta">${patient.age} years, ${patient.gender} | ID: ${patient.id}</div>
                    `;
                    
                    resultItem.addEventListener('click', function() {
                        consultPatientSearchInput.value = patient.name;
                        consultPatientSearchInput.dataset.patientId = patient.id;
                        consultPatientSearchResults.classList.remove('show');
                    });
                    
                    consultPatientSearchResults.appendChild(resultItem);
                });
                
                consultPatientSearchResults.classList.add('show');
            } else {
                consultPatientSearchResults.innerHTML = '<div class="no-results">No patients found</div>';
                consultPatientSearchResults.classList.add('show');
            }
        });
        
        // Close search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!consultPatientSearchInput.contains(e.target) && !consultPatientSearchResults.contains(e.target)) {
                consultPatientSearchResults.classList.remove('show');
            }
        });
    }
}

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

/**
 * Save appointment
 */
function saveAppointment() {
    const patientInput = document.getElementById('patientSearch');
    const dateInput = document.getElementById('appointmentDate');
    const timeInput = document.getElementById('appointmentTime');
    const typeInput = document.getElementById('appointmentType');
    const reasonInput = document.getElementById('appointmentReason');
    const durationInput = document.getElementById('appointmentDuration');
    const sendReminderInput = document.getElementById('sendReminder');
    
    // Validate inputs
    if (!patientInput.value || !dateInput.value || !timeInput.value || !typeInput.value) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // Show loading state
    const saveBtn = document.getElementById('saveAppointmentBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Scheduling...';
    saveBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        
        // Close modal
        closeModal('newAppointmentModal');
        
        // Show success message
        showNotification('Appointment scheduled successfully', 'success');
        
        // Reset form
        document.getElementById('appointmentForm').reset();
        
        // Add appointment to list (in a real app, this would come from the server)
        addAppointmentToList({
            id: Math.floor(Math.random() * 1000),
            patient: patientInput.value,
            patientId: patientInput.dataset.patientId || '000',
            date: formatDate(new Date(dateInput.value)),
            time: formatTime(timeInput.value),
            type: typeInput.value,
            reason: reasonInput.value || 'General consultation',
            duration: durationInput.value
        });
    }, 1500);
}

/**
 * Add appointment to list
 */
function addAppointmentToList(appointment) {
    const appointmentList = document.querySelector('.appointment-list');
    
    if (appointmentList) {
        const appointmentItem = document.createElement('div');
        appointmentItem.className = 'appointment-item';
        appointmentItem.dataset.id = appointment.id;
        appointmentItem.innerHTML = `
            <div class="appointment-time">
                <span class="time-display">${appointment.time}</span>
                <span class="appointment-type ${appointment.type}">${appointment.type === 'in-person' ? 'In-Person' : 'Virtual'}</span>
            </div>
            <div class="appointment-details">
                <h4>${appointment.patient}</h4>
                <p>${appointment.reason}</p>
                <div class="patient-meta">
                    <span><i class="fas fa-calendar-day"></i> ${appointment.date}</span>
                    <span><i class="fas fa-clock"></i> ${appointment.duration} min</span>
                </div>
            </div>
            <div class="appointment-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="startConsultation(${appointment.id})">
                    Start
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="rescheduleAppointment(${appointment.id})">
                    Reschedule
                </button>
            </div>
        `;
        
        // Add to the top of the list
        appointmentList.insertBefore(appointmentItem, appointmentList.firstChild);
        
        // Apply animation
        setTimeout(() => {
            appointmentItem.classList.add('show');
        }, 10);
    }
}

/**
 * Start consultation
 */
function startConsultation(id) {
    const appointmentItem = document.querySelector(`.appointment-item[data-id="${id}"]`);
    
    if (appointmentItem) {
        const patientName = appointmentItem.querySelector('h4').textContent;
        
        // Simulate loading state
        const startBtn = appointmentItem.querySelector('.btn-outline-primary');
        const originalText = startBtn.textContent;
        startBtn.textContent = 'Connecting...';
        startBtn.disabled = true;
        
        // Show notification
        showNotification(`Starting consultation with ${patientName}`, 'info');
        
        // Simulate loading then redirect
        setTimeout(() => {
            // In a real app, this would redirect to a video call or consultation page
            showNotification(`Connected with ${patientName}`, 'success');
            startBtn.textContent = originalText;
            startBtn.disabled = false;
            
            // Simulate redirecting to consultation
            window.location.href = '#consultations-page';
            document.querySelector('.tab-link[data-target="consultations-page"]')?.click();
        }, 2000);
    }
}

/**
 * Start new consultation from modal
 */
function startNewConsultation() {
    // Check which tab is active
    const scheduledTab = document.getElementById('scheduledTab');
    
    if (!scheduledTab.classList.contains('hidden')) {
        // Get selected consultation
        const selectedConsultation = document.querySelector('.consultation-item.selected');
        
        if (!selectedConsultation) {
            showNotification('Please select a patient from the list', 'error');
            return;
        }
        
        // Get patient info
        const patientName = selectedConsultation.querySelector('h4').textContent;
        const consultationId = selectedConsultation.dataset.id;
        
        // Close modal
        closeModal('newConsultationModal');
        
        // Start consultation
        showNotification(`Starting consultation with ${patientName}`, 'info');
        
        // Simulate redirect
        setTimeout(() => {
            window.location.href = '#consultations-page';
            document.querySelector('.tab-link[data-target="consultations-page"]')?.click();
        }, 1500);
    } else {
        // Get patient from immediate tab
        const patientInput = document.getElementById('consultPatientSearch');
        const consultationType = document.getElementById('consultationType');
        
        if (!patientInput.value) {
            showNotification('Please select a patient', 'error');
            return;
        }
        
        // Close modal
        closeModal('newConsultationModal');
        
        // Start consultation
        showNotification(`Starting ${consultationType.value} consultation with ${patientInput.value}`, 'info');
        
        // Simulate redirect
        setTimeout(() => {
            window.location.href = '#consultations-page';
            document.querySelector('.tab-link[data-target="consultations-page"]')?.click();
        }, 1500);
    }
}

/**
 * Reschedule appointment
 */
function rescheduleAppointment(id) {
    const appointmentItem = document.querySelector(`.appointment-item[data-id="${id}"]`);
    
    if (appointmentItem) {
        const patientName = appointmentItem.querySelector('h4').textContent;
        
        // Simulate opening reschedule dialog
        showNotification(`Opening reschedule dialog for ${patientName}`, 'info');
        
        // For demo, we'll just open the new appointment modal
        openModal('newAppointmentModal');
        
        // Pre-fill patient name
        const patientInput = document.getElementById('patientSearch');
        if (patientInput) {
            patientInput.value = patientName;
        }
    }
}

/**
 * View patient details
 */
function viewPatientDetails(id) {
    // Simulate loading patient details
    showNotification('Loading patient details...', 'info');
    
    // Redirect to patient page
    setTimeout(() => {
        window.location.href = '#patients-page';
        document.querySelector('.tab-link[data-target="patients-page"]')?.click();
    }, 1000);
}

/**
 * Write new prescription
 */
function writeNewPrescription(id) {
    // Simulate opening prescription form
    showNotification('Opening prescription form...', 'info');
    
    // Redirect to prescriptions page
    setTimeout(() => {
        window.location.href = '#prescriptions-page';
        document.querySelector('.tab-link[data-target="prescriptions-page"]')?.click();
    }, 1000);
}

/**
 * Schedule follow-up
 */
function scheduleFollowUp(id) {
    // Open appointment modal
    openModal('newAppointmentModal');
    
    // Pre-fill patient name based on id
    const patientInput = document.getElementById('patientSearch');
    const patients = {
        101: 'Aarav Patel',
        102: 'Priya Singh',
        103: 'Vikram Malhotra'
    };
    
    if (patientInput && patients[id]) {
        patientInput.value = patients[id];
        patientInput.dataset.patientId = id;
    }
}

/**
 * View report
 */
function viewReport(id) {
    // Simulate opening report
    showNotification('Opening medical report...', 'info');
}

/**
 * Approve report
 */
function approveReport(id) {
    // Simulate approving report
    const reportRow = document.querySelector(`tr[data-report-id="${id}"]`) || 
                     document.querySelector(`tr:has(button[onclick="approveReport(${id})"])`);
    
    if (reportRow) {
        const statusBadge = reportRow.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = 'status-badge approved';
            statusBadge.textContent = 'Approved';
        }
        
        // Disable approve button
        const approveBtn = reportRow.querySelector(`button[onclick="approveReport(${id})"]`);
        if (approveBtn) {
            approveBtn.disabled = true;
            approveBtn.classList.add('disabled');
        }
        
        showNotification('Report approved successfully', 'success');
    }
}

/**
 * Utility function to show a notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        </div>
        <div class="notification-content">
            <p>${message}</p>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Set up close button
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Auto close after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

/**
 * Format date
 */
function formatDate(date) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format time
 */
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Logout functionality
 */
function logoutUser() {
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to logout?');
    
    if (confirmed) {
        // Clear user data
        localStorage.removeItem('userData');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userType');
        
        // Redirect to login page
        window.location.href = '/login/';
    }
} 