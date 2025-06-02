/**
 * Interactive Timeline JavaScript
 * Handles timeline functionality, filtering, searching, and animations
 */

class TimelineManager {
    constructor() {
        this.innovations = [];
        this.filteredInnovations = [];
        this.categories = [];
        this.currentFilters = {
            search: '',
            category: 'all',
            startYear: null,
            endYear: null,
            period: null
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.renderTimeline();
        } catch (error) {
            console.error('Failed to initialize timeline:', error);
            this.showError('Failed to load timeline data. Please refresh the page.');
        }
    }

    async loadData() {
        try {
            // Load innovations
            const innovationsResponse = await fetch('/api/innovations');
            if (!innovationsResponse.ok) throw new Error('Failed to load innovations');
            this.innovations = await innovationsResponse.json();
            
            // Load categories
            const categoriesResponse = await fetch('/api/categories');
            if (!categoriesResponse.ok) throw new Error('Failed to load categories');
            this.categories = await categoriesResponse.json();
            
            this.filteredInnovations = [...this.innovations];
            this.populateCategoryFilter();
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        // Clear existing options except "All Categories"
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        
        // Add category options
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.toLowerCase();
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            }, 300));
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.applyFilters();
            });
        }

        // Year filters
        const startYear = document.getElementById('startYear');
        const endYear = document.getElementById('endYear');
        
        if (startYear) {
            startYear.addEventListener('input', this.debounce((e) => {
                this.currentFilters.startYear = e.target.value ? parseInt(e.target.value) : null;
                this.applyFilters();
            }, 500));
        }
        
        if (endYear) {
            endYear.addEventListener('input', this.debounce((e) => {
                this.currentFilters.endYear = e.target.value ? parseInt(e.target.value) : null;
                this.applyFilters();
            }, 500));
        }

        // Clear filters button
        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Period buttons
        const periodButtons = document.querySelectorAll('.period-btn');
        periodButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.currentTarget.dataset.period;
                this.selectPeriod(period);
            });
        });
    }

    debounce(func, wait) {
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

    selectPeriod(period) {
        // Update button states
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        // Set year ranges based on period
        const periods = {
            ancient: { start: -10000, end: 500 },
            medieval: { start: 500, end: 1500 },
            industrial: { start: 1500, end: 1900 },
            modern: { start: 1900, end: 1990 },
            digital: { start: 1990, end: new Date().getFullYear() }
        };

        if (periods[period]) {
            this.currentFilters.startYear = periods[period].start;
            this.currentFilters.endYear = periods[period].end;
            this.currentFilters.period = period;
            
            // Update year inputs
            document.getElementById('startYear').value = periods[period].start;
            document.getElementById('endYear').value = periods[period].end;
            
            this.applyFilters();
        }
    }

    clearAllFilters() {
        // Reset all filters
        this.currentFilters = {
            search: '',
            category: 'all',
            startYear: null,
            endYear: null,
            period: null
        };

        // Reset form inputs
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('startYear').value = '';
        document.getElementById('endYear').value = '';

        // Reset period buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.innovations];

        // Apply search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(innovation =>
                innovation.title.toLowerCase().includes(searchTerm) ||
                innovation.description.toLowerCase().includes(searchTerm) ||
                (innovation.inventor && innovation.inventor.toLowerCase().includes(searchTerm))
            );
        }

        // Apply category filter
        if (this.currentFilters.category !== 'all') {
            filtered = filtered.filter(innovation =>
                innovation.category.toLowerCase() === this.currentFilters.category
            );
        }

        // Apply year range filters
        if (this.currentFilters.startYear !== null) {
            filtered = filtered.filter(innovation => innovation.year >= this.currentFilters.startYear);
        }
        if (this.currentFilters.endYear !== null) {
            filtered = filtered.filter(innovation => innovation.year <= this.currentFilters.endYear);
        }

        // Sort by year
        filtered.sort((a, b) => a.year - b.year);

        this.filteredInnovations = filtered;
        this.renderTimeline();
        this.updateResultsCounter();
    }

    updateResultsCounter() {
        const counter = document.getElementById('resultsCounter');
        const countSpan = document.getElementById('resultCount');
        
        if (counter && countSpan) {
            countSpan.textContent = this.filteredInnovations.length;
            counter.style.display = 'block';
        }
    }

    renderTimeline() {
        const container = document.getElementById('timelineContent');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const emptyState = document.getElementById('emptyState');

        if (!container) return;

        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }

        // Clear existing content
        container.innerHTML = '';

        // Show empty state if no results
        if (this.filteredInnovations.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        } else {
            if (emptyState) {
                emptyState.style.display = 'none';
            }
        }

        // Render timeline items
        this.filteredInnovations.forEach((innovation, index) => {
            const timelineItem = this.createTimelineItem(innovation, index);
            container.appendChild(timelineItem);
        });

        // Trigger animations
        this.animateTimelineItems();
    }

    createTimelineItem(innovation, index) {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.style.animationDelay = `${index * 0.1}s`;

        const yearFormatted = this.formatYear(innovation.year);
        const categoryClass = `category-${innovation.category.toLowerCase().replace(/\s+/g, '-')}`;

        item.innerHTML = `
            <div class="timeline-card" data-innovation-id="${innovation.id}" tabindex="0" role="button" aria-label="View details for ${innovation.title}">
                <div class="timeline-year">${yearFormatted}</div>
                <h3 class="timeline-title">${this.escapeHtml(innovation.title)}</h3>
                <p class="timeline-description">${this.truncateText(innovation.description, 120)}</p>
                <div class="timeline-meta">
                    <span class="timeline-category ${categoryClass}">${innovation.category}</span>
                    ${innovation.inventor ? `<span class="timeline-inventor">by ${this.escapeHtml(innovation.inventor)}</span>` : ''}
                </div>
            </div>
            <div class="timeline-dot"></div>
        `;

        // Add click event listener
        const card = item.querySelector('.timeline-card');
        card.addEventListener('click', () => this.showInnovationDetail(innovation));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.showInnovationDetail(innovation);
            }
        });

        return item;
    }

    formatYear(year) {
        if (year < 0) {
            return `${Math.abs(year)} BCE`;
        } else {
            return `${year} CE`;
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    animateTimelineItems() {
        const items = document.querySelectorAll('.timeline-item');
        
        // Use Intersection Observer for better performance
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        items.forEach(item => {
            item.style.animationPlayState = 'paused';
            observer.observe(item);
        });
    }

    showInnovationDetail(innovation) {
        const modal = document.getElementById('innovationModal');
        if (!modal) return;

        // Populate modal content
        document.getElementById('modalTitle').textContent = innovation.title;
        document.getElementById('modalYear').textContent = this.formatYear(innovation.year);
        document.getElementById('modalInventor').textContent = innovation.inventor || 'Unknown';
        document.getElementById('modalLocation').textContent = innovation.location || 'Unknown';
        document.getElementById('modalCategory').textContent = innovation.category;
        document.getElementById('modalDescription').textContent = innovation.description;
        document.getElementById('modalImpact').textContent = innovation.impact;

        // Set category badge color
        const categoryBadge = document.getElementById('modalCategory');
        const categoryClass = `category-${innovation.category.toLowerCase().replace(/\s+/g, '-')}`;
        categoryBadge.className = `badge ${categoryClass}`;

        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    showError(message) {
        const container = document.getElementById('timelineContent');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger text-center" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    ${message}
                </div>
            `;
        }
    }
}

// Initialize timeline when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimelineManager();
});

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
