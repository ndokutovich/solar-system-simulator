/**
 * Mobile UI Manager
 * Handles responsive UI behavior, touch gestures, and mobile-specific interactions
 */
export class MobileUI {
    constructor(app) {
        this.app = app;
        this.isMobile = false;
        this.isTablet = false;
        this.controlPanelOpen = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.lastTap = 0;

        // Initialize on creation
        this.init();
    }

    init() {
        this.detectDevice();
        this.setupHamburgerMenu();
        this.setupTouchGestures();
        this.setupFloatingControls();
        this.handleOrientationChange();
        this.setupSwipeGestures();

        // Listen for resize events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
    }

    detectDevice() {
        const width = window.innerWidth;

        // Simple detection based on screen size for UI layout
        this.isMobile = width < 640;
        this.isTablet = width >= 640 && width < 1024;

        // Check if device supports touch (for adding extra touch features)
        this.hasTouch = ('ontouchstart' in window) ||
                        (navigator.maxTouchPoints > 0) ||
                        (navigator.msMaxTouchPoints > 0);

        // Add device class to body
        document.body.classList.remove('is-mobile', 'is-tablet', 'is-desktop', 'has-touch');

        if (this.hasTouch) {
            document.body.classList.add('has-touch');
        }

        if (this.isMobile) {
            document.body.classList.add('is-mobile');
            // Auto-hide control panel on mobile-sized screens
            this.setControlPanelState(false);
        } else if (this.isTablet) {
            document.body.classList.add('is-tablet');
            // Collapse panel on tablet-sized screens
            this.setControlPanelState(false);
        } else {
            document.body.classList.add('is-desktop');
            // Keep panel open on desktop
            this.setControlPanelState(true);
        }
    }

    setupHamburgerMenu() {
        // Create hamburger button if it doesn't exist
        let hamburger = document.getElementById('hamburger-menu');
        if (!hamburger) {
            hamburger = document.createElement('button');
            hamburger.id = 'hamburger-menu';
            hamburger.className = 'hamburger-menu';
            hamburger.setAttribute('aria-label', 'Toggle menu');
            hamburger.innerHTML = `
                <span></span>
                <span></span>
                <span></span>
            `;
            document.body.appendChild(hamburger);
        }

        // Create overlay for mobile drawer (initially hidden)
        let overlay = document.getElementById('mobile-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mobile-overlay';
            overlay.className = 'mobile-overlay';  // No 'active' class by default
            document.body.appendChild(overlay);
        }

        // Toggle control panel
        hamburger.addEventListener('click', () => {
            this.toggleControlPanel();
        });

        // Close panel when clicking overlay
        overlay.addEventListener('click', () => {
            if (this.controlPanelOpen) {
                this.toggleControlPanel();
            }
        });
    }

    toggleControlPanel() {
        this.controlPanelOpen = !this.controlPanelOpen;
        this.setControlPanelState(this.controlPanelOpen);
    }

    setControlPanelState(open) {
        const panel = document.getElementById('control-panel');
        const hamburger = document.getElementById('hamburger-menu');
        const overlay = document.getElementById('mobile-overlay');

        if (!panel) return;

        this.controlPanelOpen = open;

        if (open) {
            panel.classList.add('open');
            hamburger?.classList.add('active');
            overlay?.classList.add('active');

            // Prevent body scroll when panel is open on mobile
            if (this.isMobile) {
                document.body.style.overflow = 'hidden';
            }
        } else {
            panel.classList.remove('open');
            hamburger?.classList.remove('active');
            overlay?.classList.remove('active');

            // Restore body scroll
            document.body.style.overflow = '';
        }
    }

    setupFloatingControls() {
        // Create floating action buttons for mobile screens with touch
        if (!this.isMobile || !this.hasTouch) return;

        let floatingControls = document.getElementById('floating-controls');
        if (!floatingControls) {
            floatingControls = document.createElement('div');
            floatingControls.id = 'floating-controls';
            floatingControls.className = 'floating-controls';
            floatingControls.innerHTML = `
                <button id="floating-play" class="floating-btn" aria-label="Play/Pause">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" fill="currentColor"/>
                    </svg>
                </button>
                <button id="floating-fullscreen" class="floating-btn" aria-label="Fullscreen">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M5 5h5v2H7v3H5V5zm14 0h-5v2h3v3h2V5zM7 14H5v5h5v-2H7v-3zm10 0v3h-3v2h5v-5h-2z" fill="currentColor"/>
                    </svg>
                </button>
            `;
            document.body.appendChild(floatingControls);

            // Hook up floating controls to app functions
            const playBtn = document.getElementById('floating-play');
            playBtn?.addEventListener('click', () => {
                if (this.app && this.app.togglePlayPause) {
                    this.app.togglePlayPause();
                    this.updatePlayButton(playBtn);
                }
            });

            const fullscreenBtn = document.getElementById('floating-fullscreen');
            fullscreenBtn?.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
    }

    updatePlayButton(button) {
        if (!this.app) return;
        const isPaused = this.app.isPaused;
        button.innerHTML = isPaused ?
            '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>' :
            '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" fill="currentColor"/></svg>';
    }

    setupTouchGestures() {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        // Add touch handlers for ALL devices that support touch
        // Mouse will still work - they don't conflict!

        // Track touch points for pinch zoom
        let touches = [];
        let lastPinchDistance = 0;

        canvas.addEventListener('touchstart', (e) => {
            if (!e.touches) return;

            touches = Array.from(e.touches);
            this.touchStartX = touches[0].clientX;
            this.touchStartY = touches[0].clientY;

            // Handle double tap for planet selection
            const currentTime = new Date().getTime();
            const tapLength = currentTime - this.lastTap;
            if (tapLength < 300 && tapLength > 0) {
                this.handleDoubleTap(e);
            }
            this.lastTap = currentTime;

            // Calculate initial pinch distance
            if (touches.length === 2) {
                const dx = touches[1].clientX - touches[0].clientX;
                const dy = touches[1].clientY - touches[0].clientY;
                lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: true });

        canvas.addEventListener('touchmove', (e) => {
            if (!e.touches) return;

            touches = Array.from(e.touches);

            if (touches.length === 2) {
                // Only prevent default for pinch zoom to avoid browser zoom
                e.preventDefault();

                // Pinch zoom
                const dx = touches[1].clientX - touches[0].clientX;
                const dy = touches[1].clientY - touches[0].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (lastPinchDistance > 0) {
                    const scale = distance / lastPinchDistance;
                    this.handlePinchZoom(scale);
                }
                lastPinchDistance = distance;
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            if (!e.touches) return;

            touches = Array.from(e.touches);
            if (touches.length < 2) {
                lastPinchDistance = 0;
            }
        }, { passive: true });
    }

    setupSwipeGestures() {
        const panel = document.getElementById('control-panel');
        // Setup swipe gestures on touch devices
        if (!panel || !this.hasTouch) return;

        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        panel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            panel.style.transition = 'none';
        });

        panel.addEventListener('touchmove', (e) => {
            if (!isDragging) return;

            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;

            // Only allow swiping left to close
            if (deltaX < 0) {
                panel.style.transform = `translateX(${deltaX}px)`;
            }
        });

        panel.addEventListener('touchend', (e) => {
            if (!isDragging) return;

            isDragging = false;
            panel.style.transition = '';

            const deltaX = currentX - startX;

            // If swiped more than 50px, close the panel
            if (deltaX < -50) {
                this.setControlPanelState(false);
            } else {
                panel.style.transform = '';
            }
        });
    }

    handleDoubleTap(e) {
        // Implement planet selection on double tap
        if (this.app && this.app.handleDoubleTap) {
            const touch = e.touches[0];
            this.app.handleDoubleTap(touch.clientX, touch.clientY);
        }
    }

    handlePinchZoom(scale) {
        // Implement camera zoom on pinch
        if (this.app && this.app.camera && this.app.controls) {
            const camera = this.app.camera;
            const minDistance = 0.001;    // Match OrbitControls minDistance
            const maxDistance = 100000;   // Match OrbitControls maxDistance

            // Adjust camera distance based on scale
            const currentDistance = camera.position.length();
            const newDistance = Math.max(minDistance, Math.min(maxDistance, currentDistance / scale));

            camera.position.normalize().multiplyScalar(newDistance);
            if (this.app.controls.update) {
                this.app.controls.update();
            }
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    handleResize() {
        this.detectDevice();

        // Adjust UI based on screen size and touch support
        if (this.isMobile && this.hasTouch) {
            // Setup mobile-specific controls
            if (!this.controlPanelOpen) {
                this.setControlPanelState(false);
            }
            this.setupFloatingControls();
        } else {
            // Remove floating controls when not needed
            const floatingControls = document.getElementById('floating-controls');
            if (floatingControls) {
                floatingControls.remove();
            }
        }
    }

    handleOrientationChange() {
        // Adjust UI for landscape/portrait
        const isLandscape = window.innerWidth > window.innerHeight;
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);

        // On mobile landscape, use more compact layout
        if (this.isMobile && isLandscape) {
            document.body.classList.add('mobile-landscape');
        } else {
            document.body.classList.remove('mobile-landscape');
        }
    }

    // Auto-close panel after interaction on small touch screens
    autoCloseOnMobile() {
        if (this.isMobile && this.hasTouch && this.controlPanelOpen) {
            setTimeout(() => {
                this.setControlPanelState(false);
            }, 500);
        }
    }

    // Cleanup method
    destroy() {
        window.removeEventListener('resize', () => this.handleResize());
        window.removeEventListener('orientationchange', () => this.handleOrientationChange());
    }
}