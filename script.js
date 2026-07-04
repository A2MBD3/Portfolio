// Main JavaScript File - Simplified and Fixed
class WebsiteManager {
    constructor() {
        this.profileData = this.getProfileData();
        this.currentSection = 'home';
        this.profileImages = this.getProfileImages();
        this.currentImageIndex = 0;
        this.imageInterval = null;
        this.init();
    }

    init() {
        console.log('WebsiteManager initialized');
        this.setupEventListeners();
        this.updateCurrentYear();
        this.updateUI();
        this.startImageRotation();
    }

    getProfileData() {
        return {
            "personal": {
                "name": "আবদুল্লাহ আল মামুন",
                "profession": "ওয়েব ডেভেলপার ও শিক্ষার্থী",
                "education": "ইন্টারমিডিয়েট দ্বিতীয়বর্ষ",
                "field": "বিজ্ঞান বিভাগ",
                "goal": "অনির্ধারিত",
                "passion": "নতুন টেকনোলজি শেখা",
                "location": "কাজলাহার,বানারীপাড়া, বরিশাল, বাংলাদেশ",
                "college": "শহীদ স্মৃতি ডিগ্রী কলেজ",
                "department": "বিজ্ঞান",
                "bio": "আমি আবদুল্লাহ আল মামুন, একজন শিক্ষার্থী। বিজ্ঞান বিভাগে পড়াশোনা করছি এবং ওয়েব ডেভেলপমেন্টে আমার গভীর আগ্রহ রয়েছে। আমি নতুন নতুন প্রযুক্তি শিখতে পছন্দ করি এবং ক্রিয়েটিভ কাজ করতে ভালোবাসি।"
            },
            "contact": {
                "email": "aam.abdullah1@hotmail.com",
                "phone": "01616536678",
                "address": "কাজলাহার,বানারীপাড়া, বরিশাল, বাংলাদেশ",
                "freefire": "7236610758"
            },
            "social": {
                "facebook": "https://www.facebook.com/a2mbd3",
                "whatsapp": "https://wa.me/+8801616536678",
                "github": "https://github.com/A2M36",
                "instagram": "https://instagram.com/a2mbd3"
            },
            "hobbies": [
                "ঘুম",
                "ওয়েব ডিজাইন",
                "ফ্রি ফায়ার",
                "অ্যান্ড্রয়েড মডিফিকেশন",
                "ফটোগ্রাফি",
                "গান শোনা",
                "হ্যাকিং",
                
            ],
            "skills": [
                {"name": "HTML/CSS", "level": "70"},
                {"name": "JavaScript", "level": "13"},
                {"name": "React", "level": "2"},
                {"name": "C/C++", "level": "7"},
                {"name": "Python", "level": "30"}
            ],
            "tools": [
                {
                    "name": "ক্যালকুলেটর",
                    "description": "এডভান্সড সাইন্টিফিক ক্যালকুলেটর",
                    "icon": "calculator",
                    "link": "https://www.calculator.net/scientific-calculator.html"
                },
                {
                    "name": "আবহাওয়া",
                    "description": "রিয়েল-টাইম আবহাওয়া আপডেট",
                    "icon": "cloud-sun",
                    "link": "https://live8.bmd.gov.bd/p/Weather-Forecast"
                }
            ]
        };
    }

 getProfileImages() {
    return [
        "assets/profile-default.png",
        "https://lh3.googleusercontent.com/pw/AP1GczNIgSz588M2Ld4O5KyyB3-cKwB12vs_6iCVsVe9UUzaaRmjeWgyOaRGXOboBU07RzHGk_W1UyqwTEqOVyrR22y_cHTCdph8ZgWtqgCsXE7_Bok3ttCpRmt4vDH2sruwBCgKhYCg1tBvnDxswoilubQWhg=w721-h988-s-no-gm?authuser=0",
  
        "https://lh3.googleusercontent.com/pw/AP1GczOG-NFdCVVJVwZqwsPo79rEl8nJEKYH0TVPUQyqgAIByT3qQ1hnHKSX3uNpSZtpushccB4NmvVAzL6C1hIQhfeXK5JG1ZHp9qVyxH_5nl6TTkkc4bgbi-HKAfahj4fMECgTOrGvVmL9hbEztJXb5_xPvw=w721-h988-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczMlkZgEkgImmlwjx2mf-P3J3NEU0cdkePSGb5eLGCNLEmUYwO1fa7fj-OkdFLhqsEY3U_QWOo1ceFhaYFQknaSrArft4_xdQlglxjhnJbS2uPgCYfIEE1S-4rgV4tt137EpybOFRvwUyOWWz6D5AWQRDg=w721-h988-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczPZiU4pmRzf6HN6K4hFWh4E2jrzCLLjodSCz0fdBexzW6ysGshA3E-q7puYIx7ljshRnWcDGCA1NwgxvmvjwEsct5wSwnYqpjw8qoDQVMfCr_C4tp0zbn7UhjCnU174t1S_tgK6kCDaE8Jflu1iM5kf9A=w721-h988-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczOkkVHEoscz8wF_6i3p1vbdcSGBSpN9MuC8mUS719k2hetbUOPUqXmPt-FaqRaP_FHRNXslDTUfTs-xKgD552qji_q2mxiDA7vSEQ9nXm5j5HiVMaRZi54OUz-cl4WdZlUK7VQPk0eTpMVn0RYXgi-CyA=w721-h988-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczP7RPztYpehqNW-7giqbi4XQsdTnreWMu-IAWWg0Kbyo6-1_RyITXB4CHapQVbk6OJJlSUCNJfOtEq1C1wdjcONig6N91kWYZEDbrtQFN1fxPY4y6UHHBNR6gr4gjeZPpPyjdEKFIL4Z5vXorbcZx8giw=w721-h988-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczMeey6xCXpJDdwFrbo7TlA6COxk2MbW0azEnJQ17jDxycp67L6Cx5bp_YDAY31bkjPLrrcA0bKEetGTmDusJzqOnm895lWPnK9OOXe-UrM8NTeOszirqNSRqkNbc18KqZZ69Cuj_15viDQFTmi3pVa53w=w721-h988-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczPOG0qa0ybsUn9-hGXOai267W1PaLFj2Q7-OnAhVLDn1CR--tVPrLHCdrxD-Nhbn9UAoScGurQ1fVIBEqlGjxRIjNxrerI8UYF6TXQhlp1XfpprxahWsHRWjZJt8l1bh8vmszVLz-cORN_lg9USuBOTOA=w721-h923-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczMy6eOT7GvXQCoxtW3IVLoF9Ho9stJ105oN3gSQ1ZOLDQ53hHW8U7v9gRBgo-BqaY6gAW9LG4TSZq5GiRqI8rZhnsv8ZyhVwx93yP_-3KtlDQFfCCKxUM-mVgZbvv-9S8-anph1NU5eiNnWdzNeMpsKaA=w721-h904-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczPAbYEJh4snU4FdHeHT1iUvTzkKr1LimJsjsJ1b6ywJv-8sgE2T0aqJ0mOVcwpgKAD9wpBVFV8K2Gcz2fbnCrbMIaIKSL15HhxeSLPyPy-HeCKywRTIv7xXQVmfblqiLTrjGelSpQ861bQ6CYzTltJBOA=w721-h988-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczMlIOp7Z1Y2BnT07LV9wQuN0d78UChIygoV0TzxsK4i_nd05Crao9vNlOysgkELvSIiRCT5ld55cop5aM2YdQ-r0RqLxVbZESH_BxhqBJ3owmkSdWEfG0JBEJByyogVuLifzPXb5Hrlwjnsm7JPvLM8xQ=w721-h988-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczNGKIjpuYufb0tLe0I90L1DAli3aWM_FxQhHiJd9OJLxLJRHS1Wna4qQLHT36a0RSoDJnz_8z4YeBnNSmAxrg8x_kRIbmXDjx0MNOUYFNcxnLafuz_kvTusQ-eVOfNXVDJqktZeRz2PEJpCr9M9tGPg8g=w721-h988-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczMXWbu3q02og-gplnI8Z-INcVqOz1lBH_NxS9wueLYfAv5XFrz5CNXKSITd1yn4aIZGH_hngxPJGVsx12jjQ8Bf-mRY7cdoQCetCeI3QB95h-yj0kCPuazS3lBiKox-ZMc11M0k7pi3Tw170_pNeCHNUA=w721-h988-s-no-gm?authuser=0",
        "https://lh3.googleusercontent.com/pw/AP1GczNcz2gOAXWO3v_GRRHkzXzBhnp6T6_tPEL4IcI5Igoy4EhOME8uom8IY8A3XYiDg93JhVM0Nule4nqkcV3DBnb3RekfeBDkHscj_qdCRQitX4bOiKKcx6I76Bh_fVnuy2gsF-otRsrm8MVB4UmrFHu_Dw=w721-h988-s-no-gm?authuser=0"
    ];
}

    updateUI() {
        const personal = this.profileData.personal;
        const contact = this.profileData.contact;
        const social = this.profileData.social;
        const hobbies = this.profileData.hobbies;
        const skills = this.profileData.skills;
        const tools = this.profileData.tools;

        // Update page title
        document.title = `${personal.name} - ব্যক্তিগত ওয়েবসাইট`;
        document.getElementById('pageTitle').textContent = document.title;

        // Update personal info
        document.getElementById('profileName').textContent = personal.name;
        document.getElementById('profileProfession').textContent = personal.profession;
        document.getElementById('profileEducation').textContent = personal.education;
        document.getElementById('profileLocation').textContent = personal.location;

        // Update about section
        document.getElementById('aboutText').textContent = personal.bio;
        document.getElementById('studyField').textContent = personal.field;
        document.getElementById('goal').textContent = personal.goal;
        document.getElementById('passion').textContent = personal.passion;
        document.getElementById('college').textContent = personal.college;
        document.getElementById('department').textContent = personal.department;

        // Update contact info
        document.getElementById('contactEmail').textContent = contact.email;
        document.getElementById('contactEmail').href = `mailto:${contact.email}`;
        document.getElementById('contactPhone').textContent = contact.phone;
        document.getElementById('contactPhone').href = `tel:${contact.phone.replace(/\s+/g, '')}`;
        document.getElementById('contactAddress').textContent = contact.address;

        // Update FreeFire UID
        document.getElementById('freefireUID').textContent = contact.freefire;

        // Update hobbies
        this.updateHobbies(hobbies);

        // Update skills
        this.updateSkills(skills);

        // Update projects/tools
        this.updateProjects(tools);

        // Update social links
        this.updateSocialLinks(social);
    }

    updateHobbies(hobbies) {
        const container = document.getElementById('hobbiesContainer');
        if (!container) return;

        container.innerHTML = '';
        
        hobbies.forEach(hobby => {
            const hobbyElement = document.createElement('div');
            hobbyElement.className = 'hobby-tag';
            hobbyElement.textContent = hobby;
            container.appendChild(hobbyElement);
        });
    }

    updateSkills(skills) {
        const container = document.getElementById('skillsContainer');
        if (!container) return;

        container.innerHTML = '';
        
        skills.forEach(skill => {
            const skillElement = document.createElement('div');
            skillElement.className = 'skill-item';
            
            skillElement.innerHTML = `
                <div class="skill-name">
                    <span>${skill.name}</span>
                    <span>${skill.level}%</span>
                </div>
                <div class="skill-bar">
                    <div class="skill-progress" style="width: ${skill.level}%"></div>
                </div>
            `;
            
            container.appendChild(skillElement);
        });
    }

    updateProjects(projects) {
        const container = document.getElementById('projectsContainer');
        if (!container) return;

        container.innerHTML = '';
        
        projects.forEach(project => {
            const projectElement = document.createElement('div');
            projectElement.className = 'project-card';
            
            if (project.link) {
                projectElement.style.cursor = 'pointer';
                projectElement.addEventListener('click', () => {
                    window.open(project.link, '_blank');
                });
            }
            
            projectElement.innerHTML = `
                <div class="project-icon">
                    <i class="fas fa-${project.icon || 'code'}"></i>
                </div>
                <h3>${project.name}</h3>
                <p>${project.description}</p>
                ${project.link ? `
                    <a href="${project.link}" class="project-link" target="_blank">
                        <i class="fas fa-external-link-alt"></i> দেখুন
                    </a>
                ` : ''}
            `;
            
            container.appendChild(projectElement);
        });
    }

    updateSocialLinks(social) {
        const container = document.getElementById('socialIcons');
        if (!container) return;

        container.innerHTML = '';
        
        const socialPlatforms = {
            'facebook': { icon: 'fab fa-facebook', color: '#1877F2', name: 'Facebook' },
            'twitter': { icon: 'fab fa-twitter', color: '#1DA1F2', name: 'Twitter' },
            'github': { icon: 'fab fa-github', color: '#333', name: 'GitHub' },
            'linkedin': { icon: 'fab fa-linkedin', color: '#0077B5', name: 'LinkedIn' },
            'instagram': { icon: 'fab fa-instagram', color: '#E4405F', name: 'Instagram' },
            'youtube': { icon: 'fab fa-youtube', color: '#FF0000', name: 'YouTube' },
            'whatsapp': { icon: 'fab fa-whatsapp', color: '#25D366', name: 'WhatsApp' }
        };

        Object.entries(social).forEach(([platform, url]) => {
            if (url && socialPlatforms[platform.toLowerCase()]) {
                const platformData = socialPlatforms[platform.toLowerCase()];
                
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.className = 'social-icon';
                link.title = platformData.name;
                link.innerHTML = `<i class="${platformData.icon}"></i>`;
                
                link.addEventListener('mouseenter', () => {
                    link.style.backgroundColor = platformData.color;
                });
                
                link.addEventListener('mouseleave', () => {
                    link.style.backgroundColor = '';
                });
                
                container.appendChild(link);
            }
        });
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.getAttribute('href').replace('#', '');
                this.switchSection(section);
            });
        });

        // Copy UID
        const uidElement = document.getElementById('freefireUID');
        if (uidElement) {
            uidElement.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyUID();
            });
        }

        // Copyable contact items
        document.querySelectorAll('.copyable').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const text = item.textContent.trim();
                const type = item.dataset.copy || 'টেক্সট';
                this.copyToClipboard(text, `${type} কপি করা হয়েছে`);
            });
        });

        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareWebsite();
            });
        }

        // Handle hash
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            this.switchSection(hash);
        }

        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.replace('#', '');
            if (newHash) {
                this.switchSection(newHash);
            }
        });
    }

    switchSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('href') === `#${sectionId}`) {
                btn.classList.add('active');
            }
        });

        this.currentSection = sectionId;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    startImageRotation() {
        if (this.profileImages.length <= 1) return;

        // Set initial image
        this.changeProfileImage();

        // Change image every 3 seconds
        this.imageInterval = setInterval(() => {
            this.changeProfileImage();
        }, 3000);
    }

    changeProfileImage() {
        if (this.profileImages.length === 0) return;

        const imageElement = document.getElementById('dynamicProfileImage');
        if (!imageElement) return;

        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.profileImages.length);
        } while (newIndex === this.currentImageIndex && this.profileImages.length > 1);
        
        this.currentImageIndex = newIndex;
        const nextImage = this.profileImages[this.currentImageIndex];

        // Preload image
        const img = new Image();
        img.onload = () => {
            imageElement.style.opacity = '0';
            
            setTimeout(() => {
                imageElement.src = nextImage;
                imageElement.alt = `Profile Image ${this.currentImageIndex + 1}`;
                imageElement.style.opacity = '1';
            }, 300);
        };
        
        img.onerror = () => {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.profileImages.length;
        };
        
        img.src = nextImage;
    }

    copyUID() {
        const uid = document.getElementById('freefireUID').textContent;
        this.copyToClipboard(uid, 'FreeFire UID কপি করা হয়েছে!');
    }

    async copyToClipboard(text, successMessage = 'কপি করা হয়েছে!') {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification(successMessage, 'success');
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showNotification(successMessage, 'success');
            } catch (err) {
                this.showNotification('কপি করতে ব্যর্থ হয়েছে', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    shareWebsite() {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                text: 'আবদুল্লাহ আল মামুনের ব্যক্তিগত ওয়েবসাইট দেখুন',
                url: window.location.href
            });
        } else {
            this.copyToClipboard(window.location.href, 'লিংক কপি করা হয়েছে! শেয়ার করুন।');
        }
    }

    updateCurrentYear() {
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    }

    showNotification(message, type = 'info') {
        const notificationArea = document.getElementById('notificationArea');
        if (!notificationArea) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? '✅' : '❌';
        
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        notificationArea.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Initialize immediately when script loads
document.addEventListener('DOMContentLoaded', () => {
    window.websiteManager = new WebsiteManager();
    console.log('✅ Website fully loaded and initialized');
});

// Fallback initialization
window.addEventListener('load', () => {
    if (!window.websiteManager) {
        window.websiteManager = new WebsiteManager();
        console.log('✅ WebsiteManager initialized on window load');
    }
});