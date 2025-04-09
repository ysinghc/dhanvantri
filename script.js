document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initMobileMenu();
    initStickyHeader();
    initTestimonialSlider();
    initBackToTop();
    initSmoothScroll();
    initContactForm();
    initNewsletterForm();
});

/**
 * Mobile Menu Functionality
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            
            // Change icon
            const icon = this.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close menu when clicking on menu items
        const menuItems = mainNav.querySelectorAll('a');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                mainNav.classList.remove('active');
                
                // Reset icon
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mainNav.contains(e.target) && e.target !== menuToggle && !menuToggle.contains(e.target)) {
                mainNav.classList.remove('active');
                
                // Reset icon
                const icon = menuToggle.querySelector('i');
                if (icon.classList.contains('fa-times')) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
}

/**
 * Sticky Header on Scroll
 */
function initStickyHeader() {
    const header = document.querySelector('.header');
    const heroSection = document.querySelector('.hero');
    
    if (header && heroSection) {
        const heroBottom = heroSection.offsetTop;
        
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

/**
 * Testimonial Slider
 */
function initTestimonialSlider() {
    const testimonials = document.querySelectorAll('.testimonial-item');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (testimonials.length && dots.length && prevBtn && nextBtn) {
        let activeIndex = 0;
        
        // Hide all testimonials except the first one
        testimonials.forEach((testimonial, index) => {
            if (index !== activeIndex) {
                testimonial.style.display = 'none';
            }
        });
        
        // Function to show testimonial at specific index
        function showTestimonial(index) {
            // Hide all testimonials
            testimonials.forEach(testimonial => {
                testimonial.style.display = 'none';
                testimonial.classList.remove('active');
            });
            
            // Remove active class from all dots
            dots.forEach(dot => {
                dot.classList.remove('active');
            });
            
            // Show testimonial at specified index
            testimonials[index].style.display = 'block';
            testimonials[index].classList.add('active');
            
            // Add active class to corresponding dot
            dots[index].classList.add('active');
            
            // Update active index
            activeIndex = index;
        }
        
        // Previous button click handler
        prevBtn.addEventListener('click', function() {
            let index = activeIndex - 1;
            if (index < 0) {
                index = testimonials.length - 1;
            }
            showTestimonial(index);
        });
        
        // Next button click handler
        nextBtn.addEventListener('click', function() {
            let index = activeIndex + 1;
            if (index >= testimonials.length) {
                index = 0;
            }
            showTestimonial(index);
        });
        
        // Dot click handlers
        dots.forEach((dot, index) => {
            dot.addEventListener('click', function() {
                showTestimonial(index);
            });
        });
        
        // Auto play slider
        let autoPlayInterval = setInterval(function() {
            let index = activeIndex + 1;
            if (index >= testimonials.length) {
                index = 0;
            }
            showTestimonial(index);
        }, 5000);
        
        // Stop auto play on mouse enter
        const sliderContainer = document.querySelector('.testimonial-slider');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', function() {
                clearInterval(autoPlayInterval);
            });
            
            // Resume auto play on mouse leave
            sliderContainer.addEventListener('mouseleave', function() {
                autoPlayInterval = setInterval(function() {
                    let index = activeIndex + 1;
                    if (index >= testimonials.length) {
                        index = 0;
                    }
                    showTestimonial(index);
                }, 5000);
            });
        }
    }
}

/**
 * Back to Top Button
 */
function initBackToTop() {
    const backToTopBtn = document.querySelector('.back-to-top');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        
        backToTopBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Smooth Scroll for Anchor Links
 */
function initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Skip the back to top button
            if (this.classList.contains('back-to-top')) {
                return;
            }
            
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Contact Form Submission
 */
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Gather form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // Simple validation
            if (!name || !email || !subject || !message) {
                showNotification('Please fill out all fields', 'error');
                return;
            }
            
            // Email validation
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // In a real app, you would send data to the server here
            // For demo, we'll just show a success message after a brief delay
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            
            setTimeout(() => {
                // Show success message
                showNotification('Your message has been sent successfully. We will get back to you soon!', 'success');
                
                // Reset form
                contactForm.reset();
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }, 1500);
        });
    }
}

/**
 * Newsletter Form Submission
 */
function initNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get email
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            // Validate email
            if (!email || !isValidEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // In a real app, you would send data to the server here
            // For demo, we'll just show a success message
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Subscribing...';
            
            setTimeout(() => {
                // Show success message
                showNotification('Thank you for subscribing to our newsletter!', 'success');
                
                // Reset form
                this.reset();
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }, 1500);
        });
    }
}

/**
 * Utility Functions
 */

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Show notification after a small delay
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Add close button handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        
        // Remove from DOM after animation
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.remove('show');
            
            // Remove from DOM after animation
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
} 