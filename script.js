class PortfolioApp {
    constructor() {
        this.data = null;
        this.currentSection = 'home';
        this.currentImageIndex = 0;
        this.imageInterval = null;
        this.images = [];
        this.init();
    }

    async init() {
        try {
            const response = await fetch('a.json');
            if (!response.ok) throw new Error('Failed to load data');
            this.data = await response.json();
            this.images = this.data.images?.profile || [];
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('ডাটা লোড করতে ব্যর্থ হয়েছে');
            return;
        }

        this.buildApp();
        this.setupRain();
        this.setupNavigation();
        this.setupCopyListeners();
        this.setupShareButton();
        this.startImageRotation();
        this.updateYear();
        this.switchSection('home');
    }

    buildApp() {
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = `
            ${this.buildRainContainer()}
            ${this.buildProfileSection()}
            ${this.buildNavigation()}
            ${this.buildMainContent()}
            ${this.buildFooter()}
            ${this.buildNotificationArea()}
        `;
    }

    buildRainContainer() {
        return '<div class="rain-container" id="rainContainer"></div>';
    }

    buildProfileSection() {
        return `
            <div class="profile-section">
                <div class="profile-card-wrapper">
                    <div class="profile-glow"></div>
                    <div class="profile-card-outer">
                        <div class="profile-card-inner" id="profileCard">
                            <img 
                                id="profileImage" 
                                src="${this.images[0] || ''}" 
                                alt="Profile" 
                                class="profile-image"
                            >
                            <div class="profile-overlay"></div>
                        </div>
                    </div>
                    <div class="profile-sparkle" style="top: 10%; left: 15%; animation-delay: 0s;"></div>
                    <div class="profile-sparkle" style="top: 20%; right: 12%; animation-delay: 0.5s;"></div>
                    <div class="profile-sparkle" style="bottom: 15%; left: 20%; animation-delay: 1s;"></div>
                    <div class="profile-sparkle" style="bottom: 25%; right: 18%; animation-delay: 1.5s;"></div>
                </div>
            </div>
        `;
    }

    buildNavigation() {
        return `
            <nav class="nav-container glass" id="mainNav">
                <a href="#" class="nav-btn active" data-section="home">
                    <i class="fas fa-home"></i> হোম
                </a>
                <a href="#" class="nav-btn" data-section="contact">
                    <i class="fas fa-address-book"></i> যোগাযোগ
                </a>
                <a href="#" class="nav-btn" data-section="projects">
                    <i class="fas fa-code"></i> প্রজেক্ট
                </a>
            </nav>
        `;
    }

    buildMainContent() {
        return `
            <main>
                ${this.buildHomeSection()}
                ${this.buildContactSection()}
                ${this.buildProjectsSection()}
            </main>
        `;
    }

    buildHomeSection() {
        const p = this.data.personal;
        return `
            <section id="home" class="section">
                <div class="section-card glass glass-hover profile-info-card">
                    <h1 class="profile-name">${p.name}</h1>
                    <p class="profile-profession">${p.profession}</p>
                    <div class="profile-details-row">
                        <div class="profile-detail-badge">
                            <i class="fas fa-graduation-cap"></i>
                            <span>${p.education}</span>
                        </div>
                        <div class="profile-detail-badge">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${p.location}</span>
                        </div>
                    </div>
                </div>

                <div class="section-card glass glass-hover">
                    <h2 class="section-title"><i class="fas fa-user"></i> আমার সম্পর্কে</h2>
                    <p class="about-text">${p.bio}</p>
                    <div class="about-grid">
                        <div class="about-item">
                            <i class="fas fa-book"></i>
                            <span>পড়াশোনা: ${p.field}</span>
                        </div>
                        <div class="about-item">
                            <i class="fas fa-bullseye"></i>
                            <span>লক্ষ্য: ${p.goal}</span>
                        </div>
                        <div class="about-item">
                            <i class="fas fa-heart"></i>
                            <span>প্যাশন: ${p.passion}</span>
                        </div>
                        <div class="about-item">
                            <i class="fas fa-university"></i>
                            <span>কলেজ: ${p.college}</span>
                        </div>
                        <div class="about-item">
                            <i class="fas fa-building"></i>
                            <span>ডিপার্টমেন্ট: ${p.department}</span>
                        </div>
                    </div>
                </div>

                <div class="section-card glass glass-hover">
                    <h2 class="section-title"><i class="fas fa-heart"></i> শখ</h2>
                    <div class="hobbies-container">
                        ${this.data.hobbies.map(h => `<span class="hobby-chip">${h}</span>`).join('')}
                    </div>
                </div>

                <div class="section-card glass glass-hover">
                    <h2 class="section-title"><i class="fas fa-star"></i> দক্ষতা</h2>
                    ${this.data.skills.map(s => `
                        <div class="skill-item">
                            <div class="skill-header">
                                <span>${s.name}</span>
                                <span>${s.level}%</span>
                            </div>
                            <div class="skill-bar-track">
                                <div class="skill-bar-fill" style="width: 0%" data-width="${s.level}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    buildContactSection() {
        const c = this.data.contact;
        const freefireBg = this.data.images?.freefire_bg || '';
        return `
            <section id="contact" class="section">
                <div class="section-card glass glass-hover">
                    <h2 class="section-title"><i class="fas fa-address-book"></i> যোগাযোগ</h2>
                    <div class="contact-list">
                        <div class="contact-row copy-trigger" data-copy="${c.email}" data-label="ইমেইল">
                            <i class="fas fa-envelope"></i>
                            <div>
                                <h4>ইমেইল</h4>
                                <a href="mailto:${c.email}">${c.email}</a>
                            </div>
                        </div>
                        <div class="contact-row copy-trigger" data-copy="${c.phone}" data-label="ফোন">
                            <i class="fas fa-phone"></i>
                            <div>
                                <h4>ফোন</h4>
                                <a href="tel:${c.phone.replace(/\s+/g, '')}">${c.phone}</a>
                            </div>
                        </div>
                        <div class="contact-row">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <h4>ঠিকানা</h4>
                                <span>${c.address}</span>
                            </div>
                        </div>
                    </div>

                    <div class="freefire-card glass copy-trigger" data-copy="${c.freefire}" data-label="FreeFire UID">
                        ${freefireBg ? `<img src="${freefireBg}" alt="" class="freefire-bg-img">` : ''}
                        <div class="freefire-overlay">
                            <div class="freefire-label">Free Fire UID</div>
                            <div class="freefire-uid">${c.freefire}</div>
                        </div>
                    </div>

                    ${this.buildSocialSection()}
                </div>
            </section>
        `;
    }

    buildSocialSection() {
        const social = this.data.social;
        const platforms = {
            'facebook': { icon: 'fab fa-facebook', name: 'Facebook' },
            'whatsapp': { icon: 'fab fa-whatsapp', name: 'WhatsApp' },
            'github': { icon: 'fab fa-github', name: 'GitHub' },
            'instagram': { icon: 'fab fa-instagram', name: 'Instagram' }
        };

        const links = Object.entries(social)
            .filter(([key, url]) => url && platforms[key])
            .map(([key, url]) => `
                <a href="${url}" target="_blank" rel="noopener" class="social-link-btn" title="${platforms[key].name}">
                    <i class="${platforms[key].icon}"></i>
                </a>
            `).join('');

        return `
            <div class="social-section">
                <h3 class="social-title"><i class="fas fa-share-alt"></i> সোশ্যাল মিডিয়া</h3>
                <div class="social-links-container">${links}</div>
            </div>
        `;
    }

    buildProjectsSection() {
        return `
            <section id="projects" class="section">
                <div class="section-card glass glass-hover">
                    <h2 class="section-title"><i class="fas fa-code"></i> প্রজেক্ট ও টুলস</h2>
                    <div class="projects-grid">
                        ${this.data.tools.map(tool => `
                            <div class="project-card glass glass-hover" data-link="${tool.link || ''}">
                                <div class="project-icon-wrapper">
                                    <i class="fas fa-${tool.icon || 'code'}"></i>
                                </div>
                                <h3>${tool.name}</h3>
                                <p>${tool.description}</p>
                                ${tool.link ? `<span class="project-link-text"><i class="fas fa-external-link-alt"></i> দেখুন</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    buildFooter() {
        return `
            <div class="footer-bar">
                <p>© <span id="currentYear"></span> | কোডিং জানা না জানা কোন বিশেষ ব্যাপার নয়, আইডিয়াটাই আসল <span>😉</span></p>
                <button id="shareBtn" style="margin-top: 10px; padding: 8px 20px; background: rgba(124,58,237,0.2); border: 1px solid rgba(168,85,247,0.3); color: white; border-radius: 20px; cursor: pointer; font-family: inherit;">
                    <i class="fas fa-share-alt"></i> শেয়ার
                </button>
            </div>
        `;
    }

    buildNotificationArea() {
        return '<div class="notification-container" id="notificationArea"></div>';
    }

    setupRain() {
        const container = document.getElementById('rainContainer');
        if (!container) return;

        const dropCount = 100;
        for (let i = 0; i < dropCount; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDuration = `${1 + Math.random() * 2}s`;
            drop.style.animationDelay = `${Math.random() * 3}s`;
            drop.style.height = `${15 + Math.random() * 25}px`;
            drop.style.opacity = `${0.3 + Math.random() * 0.5}`;
            container.appendChild(drop);
        }
    }

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.dataset.section;
                this.switchSection(section);
            });
        });
    }

    switchSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.add('active');
        }

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.currentSection = sectionId;

        // Animate skill bars when home section is shown
        if (sectionId === 'home') {
            setTimeout(() => this.animateSkillBars(), 100);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    animateSkillBars() {
        document.querySelectorAll('.skill-bar-fill').forEach(bar => {
            const targetWidth = bar.dataset.width;
            setTimeout(() => {
                bar.style.width = targetWidth;
            }, 200);
        });
    }

    startImageRotation() {
        if (this.images.length <= 1) return;

        this.imageInterval = setInterval(() => {
            this.changeProfileImage();
        }, 3000);
    }

    changeProfileImage() {
        if (this.images.length === 0) return;

        const imgElement = document.getElementById('profileImage');
        if (!imgElement) return;

        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.images.length);
        } while (newIndex === this.currentImageIndex && this.images.length > 1);

        this.currentImageIndex = newIndex;
        const newSrc = this.images[this.currentImageIndex];

        const preload = new Image();
        preload.onload = () => {
            imgElement.style.opacity = '0';
            setTimeout(() => {
                imgElement.src = newSrc;
                imgElement.style.opacity = '1';
            }, 300);
        };
        preload.onerror = () => {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
        };
        preload.src = newSrc;
    }

    setupCopyListeners() {
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('.copy-trigger');
            if (trigger) {
                const text = trigger.dataset.copy;
                const label = trigger.dataset.label || 'তথ্য';
                if (text) {
                    this.copyToClipboard(text, `${label} কপি করা হয়েছে!`);
                }
            }
        });

        // Project card links
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.project-card');
            if (card && card.dataset.link) {
                window.open(card.dataset.link, '_blank');
            }
        });
    }

    setupShareButton() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#shareBtn')) {
                if (navigator.share) {
                    navigator.share({
                        title: this.data?.personal?.name || 'Portfolio',
                        text: 'আমার ব্যক্তিগত ওয়েবসাইট দেখুন',
                        url: window.location.href
                    }).catch(() => {});
                } else {
                    this.copyToClipboard(window.location.href, 'লিংক কপি হয়েছে! শেয়ার করুন।');
                }
            }
        });
    }

    async copyToClipboard(text, message) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('✅', message);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                this.showToast('✅', message);
            } catch {
                this.showToast('❌', 'কপি করতে ব্যর্থ হয়েছে');
            }
            document.body.removeChild(ta);
        }
    }

    showToast(icon, message) {
        const area = document.getElementById('notificationArea');
        if (!area) return;

        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-msg">${message}</span>
            <button class="toast-close">✕</button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        area.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 4000);
    }

    updateYear() {
        const yearEl = document.getElementById('currentYear');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    showError(message) {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; color: white; text-align: center;">
                    <div>
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #c084fc; margin-bottom: 20px;"></i>
                        <p style="font-size: 1.2rem;">${message}</p>
                        <p style="color: rgba(255,255,255,0.6); margin-top: 10px;">অনুগ্রহ করে a.json ফাইলটি চেক করুন</p>
                    </div>
                </div>
            `;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});