document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            authButtons.classList.toggle('active');
        });
    }
    
    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    authButtons.classList.remove('active');
                }
            }
        });
    });
    
    // Animate Elements on Scroll
    const animateElements = document.querySelectorAll('.feature-card, .portal-card, .insurance-feature, .stat-item');
    
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        const animateOnScroll = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        animateElements.forEach(element => {
            element.classList.add('pre-animate');
            animateOnScroll.observe(element);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        animateElements.forEach(element => {
            element.classList.add('animate');
        });
    }
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .pre-animate {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .animate {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
    
    // Header scroll behavior
    const header = document.querySelector('header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down & past the threshold
            header.classList.add('header-hidden');
        } else {
            // Scrolling up or at the top
            header.classList.remove('header-hidden');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Add CSS for header scroll behavior
    const headerStyle = document.createElement('style');
    headerStyle.textContent = `
        header {
            transition: transform 0.3s ease;
        }
        .header-hidden {
            transform: translateY(-100%);
        }
    `;
    document.head.appendChild(headerStyle);
}); 