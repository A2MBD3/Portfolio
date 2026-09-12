class DynamicPortfolio {
    constructor() {
        this.data = null;
        this.currentSection = 'home';
        this.currentImageIndex = 0;
        this.imageInterval = null;
        this.isSubmitting = false;
        
        // Music properties
        this.musicEnabled = false;
        this.musicVolume = 0.3;
        this.currentTrackIndex = 0;
        this.audio = null;
        this.shakeEnabled = false;
        this.shakeThreshold = 15;
        this.lastShakeTime = 0;
        this.shakeCooldown = 1000;
        this.lastX = null;
        this.lastY = null;
        this.lastZ = null;
        this.musicTracks = [];
        this.failedTracks = new Set();
        this.wasPlayingBeforeHidden = false;
        
        this.init();
    }

    async init() {
        try {
            const response = await fetch('a2mbd3.json');
            if (!response.ok) throw new Error('Failed to load data');
            this.data = await response.json();
            
            this.setMetaTags();
            this.applyTheme();
            this.buildApp();
            this.setupRain();
            this.setupNavigation();
            this.setupCopyListeners();
            this.setupShareButton();
            this.setupContactForm();
            this.startImageRotation();
            this.updateYear();
            this.switchSection('home');
            this.initMusic();
            
            window.dynamicPortfolio = this;
            document.dispatchEvent(new CustomEvent('portfolioReady', { detail: this }));
        } catch (error) {
            console.error('Error:', error);
            this.showError('ডাটা লোড করতে ব্যর্থ হয়েছে');
        }
    }

    // ===== BACKGROUND MUSIC =====
    initMusic() {
        const musicConfig = this.data.music;
        if (!musicConfig || !musicConfig.enabled) {
            console.log('🎵 Music disabled in config');
            return;
        }

        if (!musicConfig.tracks || musicConfig.tracks.length === 0) {
            console.log('🎵 No tracks found');
            return;
        }

        this.musicEnabled = true;
        this.musicVolume = musicConfig.volume || 0.3;
        this.shakeEnabled = musicConfig.shakeToChange !== false;
        this.shakeThreshold = musicConfig.shakeThreshold || 15;
        this.musicTracks = [...musicConfig.tracks];
        this.failedTracks = new Set();
        this.wasPlayingBeforeHidden = false;

        this.audio = document.createElement('audio');
        this.audio.id = 'bgMusic';
        this.audio.style.display = 'none';
        this.audio.preload = 'auto';
        this.audio.volume = this.musicVolume;
        this.audio.loop = false;
        document.body.appendChild(this.audio);

        this.selectRandomTrack();

        this.audio.addEventListener('ended', () => {
            this.playNextTrack();
        });

        this.audio.addEventListener('error', () => {
            console.warn(`🎵 Failed to load: ${this.audio.src}`);
            this.failedTracks.add(this.audio.src);
            this.playNextTrack();
        });

        this.setupVisibilityHandler();
        this.tryAutoplay();

        if (this.shakeEnabled) {
            this.setupShakeDetection();
        }

        console.log(`🎵 Music initialized | Volume: ${this.musicVolume * 100}% | Tracks: ${this.musicTracks.length} | Shake: ${this.shakeEnabled}`);
    }

    selectRandomTrack() {
        const availableTracks = this.musicTracks.filter(track => !this.failedTracks.has(track.url));
        
        if (availableTracks.length === 0) {
            console.log('🎵 All tracks failed, resetting...');
            this.failedTracks.clear();
            this.currentTrackIndex = Math.floor(Math.random() * this.musicTracks.length);
        } else {
            const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
            this.currentTrackIndex = this.musicTracks.findIndex(t => t.url === randomTrack.url);
        }
        
        this.loadTrack(this.currentTrackIndex);
    }

    loadTrack(index) {
        if (!this.musicTracks || index >= this.musicTracks.length) return;
        
        this.currentTrackIndex = index;
        const track = this.musicTracks[index];
        
        this.audio.pause();
        this.audio.src = track.url;
        this.audio.load();
        
        console.log(`🎵 Loading: ${track.name}`);
    }

    playNextTrack() {
        if (!this.musicTracks || this.musicTracks.length === 0) return;
        
        const availableTracks = this.musicTracks.filter(track => !this.failedTracks.has(track.url));
        
        if (availableTracks.length === 0) {
            this.failedTracks.clear();
        }
        
        let nextIndex;
        const validTracks = this.musicTracks.filter((_, i) => !this.failedTracks.has(this.musicTracks[i].url));
        
        if (validTracks.length === 0) {
            this.failedTracks.clear();
            nextIndex = Math.floor(Math.random() * this.musicTracks.length);
        } else if (validTracks.length === 1) {
            nextIndex = this.musicTracks.findIndex(t => t.url === validTracks[0].url);
        } else {
            do {
                const randomTrack = validTracks[Math.floor(Math.random() * validTracks.length)];
                nextIndex = this.musicTracks.findIndex(t => t.url === randomTrack.url);
            } while (nextIndex === this.currentTrackIndex && validTracks.length > 1);
        }
        
        this.loadTrack(nextIndex);
        
        if (!document.hidden) {
            this.audio.play().catch(() => {});
        }
        
        console.log(`🎵 Now playing: ${this.musicTracks[nextIndex].name}`);
    }

    changeTrack() {
        if (!this.musicEnabled || !this.audio) return;
        
        const now = Date.now();
        if (now - this.lastShakeTime < this.shakeCooldown) return;
        this.lastShakeTime = now;
        
        this.playNextTrack();
    }

    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (!this.musicEnabled || !this.audio) return;
            
            if (document.hidden) {
                this.wasPlayingBeforeHidden = !this.audio.paused;
                if (this.wasPlayingBeforeHidden) {
                    this.audio.pause();
                    console.log('🎵 Paused (tab hidden)');
                }
            } else {
                if (this.wasPlayingBeforeHidden && this.audio.src) {
                    this.audio.play()
                        .then(() => console.log('🎵 Resumed (tab visible)'))
                        .catch(err => console.log('🎵 Resume failed:', err));
                }
                this.wasPlayingBeforeHidden = false;
            }
        });
    }

    tryAutoplay() {
        if (!this.audio) return;
        
        if (document.hidden) {
            this.wasPlayingBeforeHidden = true;
            console.log('🎵 Tab hidden, waiting for visibility...');
            return;
        }
        
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('🎵 Autoplay started');
            }).catch(() => {
                console.log('🎵 Autoplay blocked, waiting for user interaction...');
                this.waitForUserInteraction();
            });
        }
    }

    waitForUserInteraction() {
        const startMusic = () => {
            if (this.audio && this.musicEnabled && !document.hidden) {
                this.audio.play().catch(() => {});
            }
            document.removeEventListener('click', startMusic);
            document.removeEventListener('touchstart', startMusic);
            document.removeEventListener('scroll', startMusic);
            document.removeEventListener('keydown', startMusic);
        };

        document.addEventListener('click', startMusic, { once: true });
        document.addEventListener('touchstart', startMusic, { once: true });
        document.addEventListener('scroll', startMusic, { once: true });
        document.addEventListener('keydown', startMusic, { once: true });
    }

    setupShakeDetection() {
        if (!window.DeviceMotionEvent) {
            console.log('🎵 Shake not supported on this device');
            return;
        }

        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            document.addEventListener('click', () => {
                DeviceMotionEvent.requestPermission()
                    .then(state => {
                        if (state === 'granted') {
                            this.startMotionListener();
                        }
                    })
                    .catch(() => {});
            }, { once: true });
        } else {
            this.startMotionListener();
        }
    }

    startMotionListener() {
        window.addEventListener('devicemotion', (event) => {
            if (!this.shakeEnabled) return;
            
            const acc = event.accelerationIncludingGravity;
            if (!acc) return;

            const x = acc.x;
            const y = acc.y;
            const z = acc.z;

            if (this.lastX === null) {
                this.lastX = x;
                this.lastY = y;
                this.lastZ = z;
                return;
            }

            const deltaX = Math.abs(x - this.lastX);
            const deltaY = Math.abs(y - this.lastY);
            const deltaZ = Math.abs(z - this.lastZ);

            const shakeMagnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

            if (shakeMagnitude > this.shakeThreshold) {
                this.changeTrack();
            }

            this.lastX = x;
            this.lastY = y;
            this.lastZ = z;
        });

        console.log('🎵 Shake detection active');
    }

    // ===== META TAGS =====
    setMetaTags() {
        if (this.data.site) {
            document.title = this.data.site.title || 'Portfolio';
            
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.name = 'description';
                document.head.appendChild(metaDesc);
            }
            metaDesc.content = this.data.site.description || '';
            
            if (this.data.site.lang) {
                document.documentElement.lang = this.data.site.lang;
            }
        }
    }

    applyTheme() {
        const theme = this.data.theme || {};
        const root = document.documentElement;
        
        if (theme.primaryColor) root.style.setProperty('--purple-1', theme.primaryColor);
        if (theme.secondaryColor) root.style.setProperty('--purple-2', theme.secondaryColor);
        if (theme.accentColor) root.style.setProperty('--purple-3', theme.accentColor);
        if (theme.backgroundColor) root.style.setProperty('--bg-deep', theme.backgroundColor);
        if (theme.surfaceColor) root.style.setProperty('--bg-mid', theme.surfaceColor);
        if (theme.glassOpacity !== undefined) {
            root.style.setProperty('--glass-opacity', theme.glassOpacity);
        }
        if (theme.fontFamily) {
            document.body.style.fontFamily = theme.fontFamily;
        }
    }

    buildApp() {
        const app = document.getElementById('app');
        if (!app) return;
        
        app.innerHTML = `
            ${this.data.theme?.rainEffect !== false ? '<div class="rain-container" id="rainContainer"></div>' : ''}
            ${this.buildNavigation()}
            <main>
                ${this.buildAllSections()}
            </main>
            ${this.buildFooter()}
            <div class="notification-container" id="notificationArea"></div>
        `;
    }

    buildProfileSection() {
        const images = this.getImages();
        const firstImg = images[0] || '';
        
        return `
            <div class="profile-section">
                <div class="profile-card-wrapper">
                    <div class="profile-glow"></div>
                    <div class="profile-card-outer">
                        <div class="profile-card-inner" id="profileCard">
                            <img id="profileImage" src="${firstImg}" alt="Profile" class="profile-image">
                            <div class="profile-overlay"></div>
                        </div>
                    </div>
                    ${this.generateSparkles()}
                </div>
            </div>
        `;
    }

    getImages() {
        if (this.data.images?.profile) return this.data.images.profile;
        if (Array.isArray(this.data.images)) return this.data.images;
        return [];
    }

    generateSparkles() {
        const positions = [
            { top: '10%', left: '15%', delay: '0s' },
            { top: '20%', right: '12%', delay: '0.5s' },
            { bottom: '15%', left: '20%', delay: '1s' },
            { bottom: '25%', right: '18%', delay: '1.5s' }
        ];
        
        return positions.map(pos => 
            `<div class="profile-sparkle" style="top:${pos.top};${pos.left ? 'left:'+pos.left : 'right:'+pos.right};animation-delay:${pos.delay}"></div>`
        ).join('');
    }

    buildNavigation() {
        const navItems = this.data.navigation || [
            { label: 'হোম', icon: 'fa-home', section: 'home' },
            { label: 'যোগাযোগ', icon: 'fa-address-book', section: 'contact' },
            { label: 'প্রজেক্ট', icon: 'fa-code', section: 'projects' }
        ];
        
        return `
            <nav class="nav-container glass" id="mainNav">
                ${navItems.map((item, index) => `
                    <a href="#" class="nav-btn ${index === 0 ? 'active' : ''}" data-section="${item.section || 'home'}">
                        <i class="fas ${item.icon || 'fa-circle'}"></i> ${item.label || 'Page'}
                    </a>
                `).join('')}
            </nav>
        `;
    }

    buildAllSections() {
        return `
            ${this.buildHomeSection()}
            ${this.buildContactSection()}
            ${this.buildProjectsSection()}
        `;
    }

    buildHomeSection() {
        const personal = this.data.personal || {};
        const profileDetails = this.data.profileDetails || [];
        const aboutItems = this.data.aboutItems || [];
        const hobbies = this.data.hobbies || [];
        const skills = this.data.skills || [];
        
        return `
            <section id="home" class="section active">
                ${this.buildProfileSection()}
                ${this.buildProfileInfoCard(personal, profileDetails)}
                ${this.buildAboutSection(personal, aboutItems)}
                ${this.buildHobbiesSection(hobbies)}
                ${this.buildSkillsSection(skills)}
            </section>
        `;
    }

    buildProfileInfoCard(person, details) {
        if (!person.name && details.length === 0) return '';
        
        return `
            <div class="section-card glass glass-hover profile-info-card">
                ${person.name ? `<h1 class="profile-name">${person.name}</h1>` : ''}
                ${person.profession ? `<p class="profile-profession">${person.profession}</p>` : ''}
                ${details.length > 0 ? `
                <div class="profile-details-row">
                    ${details.map(detail => `
                        <div class="profile-detail-badge">
                            <i class="fas ${detail.icon || 'fa-circle'}"></i>
                            <span>${detail.label || ''}</span>
                        </div>
                    `).join('')}
                </div>` : ''}
            </div>
        `;
    }

    buildAboutSection(person, items) {
        if (!person.bio && items.length === 0) return '';
        
        return `
            <div class="section-card glass glass-hover">
                <h2 class="section-title"><i class="fas fa-user"></i> আমার সম্পর্কে</h2>
                ${person.bio ? `<p class="about-text">${person.bio}</p>` : ''}
                ${items.length > 0 ? `
                <div class="about-grid">
                    ${items.map(item => `
                        <div class="about-item">
                            <i class="fas ${item.icon || 'fa-circle'}"></i>
                            <span>${item.text || ''}</span>
                        </div>
                    `).join('')}
                </div>` : ''}
            </div>
        `;
    }

    buildHobbiesSection(hobbies) {
        if (!hobbies || hobbies.length === 0) return '';
        
        return `
            <div class="section-card glass glass-hover">
                <h2 class="section-title"><i class="fas fa-heart"></i> শখ</h2>
                <div class="hobbies-container">
                    ${hobbies.map(hobby => `<span class="hobby-chip">${hobby}</span>`).join('')}
                </div>
            </div>
        `;
    }

    buildSkillsSection(skills) {
        if (!skills || skills.length === 0) return '';
        
        return `
            <div class="section-card glass glass-hover">
                <h2 class="section-title"><i class="fas fa-star"></i> দক্ষতা</h2>
                ${skills.map(skill => `
                    <div class="skill-item">
                        <div class="skill-header">
                            <span>${skill.name || 'Skill'}</span>
                            <span>${skill.level || 0}%</span>
                        </div>
                        <div class="skill-bar-track">
                            <div class="skill-bar-fill" style="width: 0%" data-width="${skill.level || 0}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    buildContactSection() {
        const contact = this.data.contact || {};
        const socialLinks = this.data.social || [];
        const contactForm = this.data.contactForm || {};
        
        return `
            <section id="contact" class="section">
                <div class="section-card glass glass-hover">
                    <h2 class="section-title"><i class="fas fa-address-book"></i> যোগাযোগ</h2>
                    
                    <div class="contact-list">
                        ${contact.email ? `
                        <div class="contact-row copy-trigger" data-copy="${contact.email}" data-label="ইমেইল">
                            <i class="fas fa-envelope"></i>
                            <div>
                                <h4>ইমেইল</h4>
                                <a href="mailto:${contact.email}">${contact.email}</a>
                            </div>
                        </div>` : ''}
                        
                        ${contact.phone ? `
                        <div class="contact-row copy-trigger" data-copy="${contact.phone}" data-label="ফোন">
                            <i class="fas fa-phone"></i>
                            <div>
                                <h4>ফোন</h4>
                                <a href="tel:${contact.phone.replace(/\s+/g, '')}">${contact.phone}</a>
                            </div>
                        </div>` : ''}
                        
                        ${contact.address ? `
                        <div class="contact-row">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <h4>ঠিকানা</h4>
                                <span>${contact.address}</span>
                            </div>
                        </div>` : ''}
                    </div>

                    ${contact.freefire ? this.buildFreeFireCard(contact) : ''}
                    ${this.buildSocialSection(socialLinks)}
                    ${contactForm.enabled !== false ? this.buildContactForm(contactForm) : ''}
                    
                </div>
            </section>
        `;
    }

    buildFreeFireCard(contact) {
        const freefireBg = this.data.images?.freefire_bg || '';
        return `
            <div class="freefire-card glass copy-trigger" data-copy="${contact.freefire}" data-label="FreeFire UID">
                ${freefireBg ? `<img src="${freefireBg}" alt="" class="freefire-bg-img">` : ''}
                <div class="freefire-overlay">
                    <div class="freefire-label">Free Fire UID</div>
                    <div class="freefire-uid">${contact.freefire}</div>
                </div>
            </div>
        `;
    }

    buildContactForm(formConfig) {
        return `
            <div class="contact-form-section">
                <h3 class="contact-form-title">
                    <i class="fas fa-paper-plane"></i> মেসেজ পাঠান
                </h3>
                <form id="contactForm" class="contact-form">
                </form>
            </div>
        `;
    }

    buildSocialSection(socialLinks) {
        if (!socialLinks || socialLinks.length === 0) return '';
        
        return `
            <div class="social-section">
                <h3 class="social-title"><i class="fas fa-share-alt"></i> সোশ্যাল মিডিয়া</h3>
                <div class="social-links-container">
                    ${socialLinks.map(link => {
                        let icon = link.icon;
                        if (!icon && link.name) {
                            const iconMap = {
                                'facebook': 'fa-facebook',
                                'whatsapp': 'fa-whatsapp',
                                'github': 'fa-github',
                                'instagram': 'fa-instagram',
                                'telegram': 'fa-telegram',
                                'youtube': 'fa-youtube',
                                'twitter': 'fa-twitter',
                                'linkedin': 'fa-linkedin',
                                'discord': 'fa-discord',
                                'tiktok': 'fa-tiktok'
                            };
                            icon = iconMap[link.name.toLowerCase()] || 'fa-link';
                        }
                        
                        return `
                            <a href="${link.url || '#'}" target="_blank" rel="noopener" 
                               class="social-link-btn" title="${link.name || 'Social Link'}"
                               style="${link.color ? '--social-color:' + link.color : ''}">
                                <i class="fab ${icon || 'fa-link'}"></i>
                            </a>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    buildProjectsSection() {
        const tools = this.data.tools || [];
        if (tools.length === 0) return '';
        
        return `
            <section id="projects" class="section">
                <div class="section-card glass glass-hover">
                    <h2 class="section-title"><i class="fas fa-code"></i> প্রজেক্ট ও টুলস</h2>
                    <div class="projects-grid">
                        ${tools.map(tool => {
                            let icon = tool.icon || 'fa-code';
                            if (icon && !icon.startsWith('fa-')) {
                                icon = 'fa-' + icon;
                            }
                            
                            return `
                                <div class="project-card glass glass-hover" data-link="${tool.link || ''}">
                                    <div class="project-icon-wrapper">
                                        <i class="fas ${icon}"></i>
                                    </div>
                                    <h3>${tool.name || 'Project'}</h3>
                                    <p>${tool.description || ''}</p>
                                    ${tool.link ? '<span class="project-link-text"><i class="fas fa-external-link-alt"></i> দেখুন</span>' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    buildFooter() {
        const footer = this.data.footer || { text: 'কোডিং জানা না জানা কোন বিশেষ ব্যাপার নয়, আইডিয়াটাই আসল 😉' };
        const year = new Date().getFullYear();
        
        return `
            <div class="footer-bar">
                <p>© <span id="currentYear">${year}</span> | ${footer.text || ''}</p>
                <button id="shareBtn" class="share-button">
                    <i class="fas fa-share-alt"></i> শেয়ার
                </button>
            </div>
        `;
    }

    setupRain() {
        if (this.data.theme?.rainEffect === false) return;
        
        const container = document.getElementById('rainContainer');
        if (!container) return;

        const dropCount = this.data.theme?.rainDropCount || 100;
        for (let i = 0; i < dropCount; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = Math.random() * 100 + '%';
            drop.style.animationDuration = (1 + Math.random() * 2) + 's';
            drop.style.animationDelay = Math.random() * 3 + 's';
            drop.style.height = (15 + Math.random() * 25) + 'px';
            drop.style.opacity = (0.3 + Math.random() * 0.5);
            container.appendChild(drop);
        }
    }

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(btn.dataset.section);
            });
        });
    }

    switchSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(sectionId);
        if (target) target.classList.add('active');

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        this.currentSection = sectionId;
        if (sectionId === 'home') setTimeout(() => this.animateSkillBars(), 100);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    animateSkillBars() {
        document.querySelectorAll('.skill-bar-fill').forEach(bar => {
            setTimeout(() => { bar.style.width = bar.dataset.width; }, 200);
        });
    }

    startImageRotation() {
        const images = this.getImages();
        if (images.length <= 1) return;

        this.imageInterval = setInterval(() => this.changeProfileImage(), 3000);
    }

    changeProfileImage() {
        const images = this.getImages();
        if (images.length === 0) return;

        const imgElement = document.getElementById('profileImage');
        if (!imgElement) return;

        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * images.length);
        } while (newIndex === this.currentImageIndex && images.length > 1);

        this.currentImageIndex = newIndex;
        const newSrc = images[this.currentImageIndex];

        const preload = new Image();
        preload.onload = () => {
            imgElement.style.opacity = '0';
            setTimeout(() => {
                imgElement.src = newSrc;
                imgElement.style.opacity = '1';
            }, 300);
        };
        preload.onerror = () => {
            this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
        };
        preload.src = newSrc;
    }

    setupCopyListeners() {
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('.copy-trigger');
            if (trigger && trigger.dataset.copy) {
                this.copyToClipboard(trigger.dataset.copy,
                    `${trigger.dataset.label || 'তথ্য'} কপি করা হয়েছে!`);
            }

            const card = e.target.closest('.project-card');
            if (card && card.dataset.link) {
                const link = card.dataset.link;
                // Relative internal links open in same tab; external in new tab
                if (link.startsWith('http://') || link.startsWith('https://')) {
                    window.open(link, '_blank', 'noopener,noreferrer');
                } else {
                    window.location.href = link;
                }
            }
        });
    }

    setupShareButton() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#shareBtn')) {
                if (navigator.share) {
                    navigator.share({
                        title: this.data.site?.title || 'Portfolio',
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
            ta.style.cssText = 'position:fixed;opacity:0;';
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

    setupContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;
        
        if (window.smsHandler && window.smsHandler.isActive) {
            return;
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.showToast('⚠️', 'ফর্ম সিস্টেম লোড হয়নি');
        });
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
        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
        area.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
    }

    updateYear() {
        const yearEl = document.getElementById('currentYear');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
    }

    showError(message) {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="display:flex;justify-content:center;align-items:center;min-height:100vh;color:white;text-align:center;">
                    <div>
                        <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:#c084fc;margin-bottom:20px;"></i>
                        <p style="font-size:1.2rem;">${message}</p>
                        <p style="color:rgba(255,255,255,0.6);margin-top:10px;">অনুগ্রহ করে a2mbd3.json ফাইলটি চেক করুন</p>
                    </div>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DynamicPortfolio();
});