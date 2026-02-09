/**
 * Performance Optimizer
 * Centralized performance optimization utilities for Who-Bible
 * Phase 8: Performance & Polish
 */

// ============================================================================
// 1. CACHING SYSTEM
// ============================================================================

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Set cache with TTL
     */
    set(key, value, ttl = this.DEFAULT_TTL) {
        this.cache.set(key, value);
        this.timestamps.set(key, Date.now() + ttl);
    }

    /**
     * Get cached value if not expired
     */
    get(key) {
        if (!this.cache.has(key)) return null;
        
        const expiry = this.timestamps.get(key);
        if (Date.now() > expiry) {
            this.delete(key);
            return null;
        }
        
        return this.cache.get(key);
    }

    /**
     * Delete cache entry
     */
    delete(key) {
        this.cache.delete(key);
        this.timestamps.delete(key);
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        this.timestamps.clear();
    }

    /**
     * Get or fetch with cache
     */
    async getOrFetch(key, fetchFn, ttl) {
        const cached = this.get(key);
        if (cached !== null) return cached;

        const value = await fetchFn();
        this.set(key, value, ttl);
        return value;
    }
}

export const cache = new CacheManager();

// ============================================================================
// 2. LAZY LOADING
// ============================================================================

/**
 * Lazy load module
 */
export async function lazyLoad(modulePath) {
    try {
        return await import(modulePath);
    } catch (error) {
        console.error(`Failed to lazy load ${modulePath}:`, error);
        throw error;
    }
}

/**
 * Lazy load multiple modules
 */
export async function lazyLoadMultiple(modulePaths) {
    return Promise.all(modulePaths.map(path => lazyLoad(path)));
}

/**
 * Intersection Observer for lazy loading elements
 */
export function createLazyLoader(callback, options = {}) {
    const defaultOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };

    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback(entry.target);
            }
        });
    }, { ...defaultOptions, ...options });
}

// ============================================================================
// 3. DEBOUNCING & THROTTLING
// ============================================================================

/**
 * Debounce function calls
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function calls
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================================================
// 4. LOADING STATES
// ============================================================================

/**
 * Show loading spinner
 */
export function showLoading(elementOrSelector, message = 'Loading...') {
    const element = typeof elementOrSelector === 'string' 
        ? document.querySelector(elementOrSelector)
        : elementOrSelector;
    
    if (!element) return;

    element.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    element.setAttribute('aria-busy', 'true');
}

/**
 * Hide loading spinner
 */
export function hideLoading(elementOrSelector) {
    const element = typeof elementOrSelector === 'string'
        ? document.querySelector(elementOrSelector)
        : elementOrSelector;
    
    if (!element) return;
    
    element.removeAttribute('aria-busy');
}

/**
 * Show skeleton screen
 */
export function showSkeleton(elementOrSelector, type = 'list') {
    const element = typeof elementOrSelector === 'string'
        ? document.querySelector(elementOrSelector)
        : elementOrSelector;
    
    if (!element) return;

    const skeletons = {
        list: `
            <div class="skeleton-list">
                ${Array(5).fill('<div class="skeleton-item"></div>').join('')}
            </div>
        `,
        card: `
            <div class="skeleton-card">
                <div class="skeleton-header"></div>
                <div class="skeleton-body"></div>
                <div class="skeleton-footer"></div>
            </div>
        `,
        profile: `
            <div class="skeleton-profile">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-name"></div>
                <div class="skeleton-stats"></div>
            </div>
        `
    };

    element.innerHTML = skeletons[type] || skeletons.list;
    element.setAttribute('aria-busy', 'true');
}

// ============================================================================
// 5. ERROR HANDLING
// ============================================================================

export class AppError extends Error {
    constructor(message, code, context = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Global error handler
 */
export function handleError(error, context = {}) {
    console.error('Error occurred:', {
        message: error.message,
        code: error.code,
        context,
        stack: error.stack
    });

    // Log to analytics if available
    if (window.logError) {
        window.logError(error, context);
    }

    // Show user-friendly error
    showErrorMessage(error);
}

/**
 * Show error message to user
 */
export function showErrorMessage(error, duration = 5000) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.setAttribute('role', 'alert');
    
    const message = error.code === 'auth/network-request-failed'
        ? 'Network error. Please check your connection.'
        : error.message || 'Something went wrong. Please try again.';
    
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-message">${message}</span>
            <button class="error-close" aria-label="Close">&times;</button>
        </div>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after duration
    const timeout = setTimeout(() => errorDiv.remove(), duration);

    // Manual close
    errorDiv.querySelector('.error-close').addEventListener('click', () => {
        clearTimeout(timeout);
        errorDiv.remove();
    });
}

/**
 * Try-catch wrapper with error handling
 */
export async function tryCatch(fn, context = {}) {
    try {
        return await fn();
    } catch (error) {
        handleError(error, context);
        throw error;
    }
}

// ============================================================================
// 6. INPUT VALIDATION
// ============================================================================

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Validate email
 */
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate username
 */
export function validateUsername(username) {
    // 3-20 chars, alphanumeric + underscore/hyphen
    const re = /^[a-zA-Z0-9_-]{3,20}$/;
    return re.test(username);
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
    return {
        length: password.length >= 8,
        hasUpper: /[A-Z]/.test(password),
        hasLower: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        isValid: password.length >= 8 && 
                 /[A-Z]/.test(password) && 
                 /[a-z]/.test(password) && 
                 /\d/.test(password)
    };
}

/**
 * Sanitize and validate user input
 */
export function sanitizeInput(input, maxLength = 1000) {
    let sanitized = String(input).trim();
    sanitized = sanitizeHTML(sanitized);
    return sanitized.slice(0, maxLength);
}

// ============================================================================
// 7. BATCH OPERATIONS
// ============================================================================

/**
 * Batch process array in chunks
 */
export async function batchProcess(items, batchSize, processFn) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(item => processFn(item))
        );
        results.push(...batchResults);
    }
    
    return results;
}

/**
 * Rate limited batch processing
 */
export async function rateLimitedBatch(items, processFn, delayMs = 100) {
    const results = [];
    
    for (const item of items) {
        const result = await processFn(item);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    return results;
}

// ============================================================================
// 8. PERFORMANCE MONITORING
// ============================================================================

/**
 * Measure function execution time
 */
export async function measurePerformance(name, fn) {
    const start = performance.now();
    try {
        const result = await fn();
        const duration = performance.now() - start;
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
        return result;
    } catch (error) {
        const duration = performance.now() - start;
        console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`);
        throw error;
    }
}

/**
 * Track page load metrics
 */
export function trackPageLoadMetrics() {
    if (typeof window.PerformanceObserver === 'undefined') return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('[Performance] LCP:', lastEntry.renderTime || lastEntry.loadTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
            console.log('[Performance] FID:', entry.processingStart - entry.startTime);
        });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
            if (!entry.hadRecentInput) {
                clsScore += entry.value;
            }
        });
        console.log('[Performance] CLS:', clsScore);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
}

// ============================================================================
// 9. RESOURCE LOADING
// ============================================================================

/**
 * Preload critical resources
 */
export function preloadResource(url, type = 'script') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    document.head.appendChild(link);
}

/**
 * Lazy load image
 */
export function lazyLoadImage(img) {
    if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy';
    } else {
        // Fallback for browsers without native lazy loading
        const observer = createLazyLoader((target) => {
            target.src = target.dataset.src;
            observer.unobserve(target);
        });
        observer.observe(img);
    }
}

// ============================================================================
// 10. INITIALIZATION
// ============================================================================

/**
 * Initialize performance optimizations
 */
export function initPerformanceOptimizations() {
    // Track page load metrics
    if (document.readyState === 'complete') {
        trackPageLoadMetrics();
    } else {
        window.addEventListener('load', trackPageLoadMetrics);
    }

    // Add global error handler
    window.addEventListener('error', (event) => {
        handleError(new AppError(
            event.message,
            'RUNTIME_ERROR',
            { filename: event.filename, lineno: event.lineno }
        ));
    });

    // Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        handleError(new AppError(
            event.reason?.message || 'Unhandled promise rejection',
            'PROMISE_REJECTION',
            { reason: event.reason }
        ));
    });

    console.log('[Performance] Optimizations initialized');
}

// Auto-initialize if not in test environment
if (typeof window !== 'undefined' && !window.__TEST__) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPerformanceOptimizations);
    } else {
        initPerformanceOptimizations();
    }
}
