// ===== SMS Handler v7 - Mode 3 API | No Fake Checks | Smart Phone Format =====
class SMSHandler {
    constructor() {
        this.storageKey = 'portfolio_user_data_v7';
        this.userData = this.loadUserData();
        this.deviceInfo = {};
        this.ipLocation = {};
        this.gpsLocation = null;
        this.visitorInfo = {};
        this.isActive = false;
        this.init();
    }

    async init() {
        await this.collectDeviceInfo();
        await this.collectIPLocation();
        this.collectVisitorInfo();
        
        document.addEventListener('portfolioReady', (e) => {
            this.portfolio = e.detail;
            this.setupFormEnhancement();
        });
        
        if (window.dynamicPortfolio) {
            this.portfolio = window.dynamicPortfolio;
            this.setupFormEnhancement();
        }
        
        console.log('📱 SMS Handler v7 initialized');
    }

    // ===== LOCAL STORAGE =====
    loadUserData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : { name: '', email: '', phone: '', socialLink: '', subject: '' };
        } catch (e) {
            return { name: '', email: '', phone: '', socialLink: '', subject: '' };
        }
    }

    saveUserData(data) {
        try {
            this.userData = { ...this.userData, ...data };
            localStorage.setItem(this.storageKey, JSON.stringify(this.userData));
        } catch (e) {}
    }

    // ===== SMART PHONE FORMATTER =====
    formatPhoneNumber(raw) {
        if (!raw || !raw.trim()) return '';
        
        // Step 1: Remove ALL non-digit characters (spaces, dashes, brackets, dots, +)
        let digits = raw.replace(/\D/g, '');
        
        // Step 2: Remove country code prefixes
        if (digits.startsWith('880')) {
            digits = digits.substring(3);
        } else if (digits.startsWith('88')) {
            digits = digits.substring(2);
        } else if (digits.startsWith('00880')) {
            digits = digits.substring(5);
        } else if (digits.startsWith('0088')) {
            digits = digits.substring(4);
        }
        
        // Step 3: If starts with 0 and has 11 digits, remove leading 0 then add back
        if (digits.startsWith('0') && digits.length === 11) {
            digits = digits.substring(1); // Remove leading 0 to get 10 digits
        }
        
        // Step 4: If 10 digits, prepend 0
        if (digits.length === 10) {
            return '0' + digits;
        }
        
        // Step 5: If 11 digits starting with 0, keep as is
        if (digits.length === 11 && digits.startsWith('0')) {
            return digits;
        }
        
        // Step 6: If 11 digits not starting with 0, prepend 0 (unlikely)
        if (digits.length === 11 && !digits.startsWith('0')) {
            return '0' + digits;
        }
        
        // Step 7: If less than 10 digits, return as is (invalid)
        if (digits.length > 0 && digits.length < 10) {
            return digits; // Will be caught by validation
        }
        
        // Step 8: If more than 11 digits, take last 10 and prepend 0
        if (digits.length > 11) {
            digits = digits.slice(-10);
            return '0' + digits;
        }
        
        return digits;
    }

    isValidPhone(raw) {
        if (!raw || !raw.trim()) return false;
        const formatted = this.formatPhoneNumber(raw);
        // Must be exactly 11 digits starting with 01
        return /^01\d{9}$/.test(formatted);
    }

    // Test cases:
    // +8801712-345678 → 01712345678 ✅
    // +8801712345678  → 01712345678 ✅
    // 01712345678     → 01712345678 ✅
    // 1712345678      → 01712345678 ✅ (10 digits, prepend 0)
    // 8801712345678   → 01712345678 ✅
    // +88 01712 345678 → 01712345678 ✅

    // ===== VISITOR INFO (no fake checks) =====
    collectVisitorInfo() {
        const ref = document.referrer || '';
        let refDomain = '';
        try {
            if (ref && ref !== '') {
                refDomain = new URL(ref).hostname.replace('www.', '');
            }
        } catch { refDomain = ref; }

        const visitCount = this.getVisitCount();
        
        this.visitorInfo = {
            ref: refDomain,
            returning: visitCount > 1 ? `${visitCount}th time` : ''
        };
    }

    getVisitCount() {
        const key = 'portfolio_visit_count_v7';
        let count = parseInt(localStorage.getItem(key) || '0');
        count++;
        localStorage.setItem(key, count.toString());
        return count;
    }

    // ===== DEVICE INFO =====
    async collectDeviceInfo() {
        const ua = navigator.userAgent;
        
        // Browser
        let browserName = '', browserVersion = '';
        if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR') && !ua.includes('SamsungBrowser')) {
            browserName = 'Chrome';
            browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || '';
        } else if (ua.includes('SamsungBrowser')) {
            browserName = 'Samsung Browser';
            browserVersion = ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] || '';
        } else if (ua.includes('Firefox')) {
            browserName = 'Firefox';
            browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || '';
        } else if (ua.includes('Edg')) {
            browserName = 'Edge';
            browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || '';
        } else if (ua.includes('OPR') || ua.includes('Opera')) {
            browserName = 'Opera';
            browserVersion = ua.match(/OPR\/([\d.]+)/)?.[1] || '';
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browserName = 'Safari';
            browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || '';
        }

        // OS
        let osName = '', osVersion = '';
        if (ua.includes('Android')) {
            osName = 'Android';
            osVersion = ua.match(/Android\s([\d.]+)/)?.[1] || '';
            const brands = ['Samsung','Xiaomi','Redmi','POCO','OPPO','vivo','OnePlus','Realme','Huawei','Honor','Infinix','Tecno','Nokia','Motorola','Google'];
            for (const brand of brands) {
                if (ua.includes(brand)) {
                    osName = `Android ${osVersion} (${brand})`;
                    break;
                }
            }
            if (osName === 'Android') osName = `Android ${osVersion}`;
        } else if (ua.includes('Windows')) {
            osName = 'Windows';
            const ntVer = ua.match(/Windows NT ([\d.]+)/)?.[1];
            const verMap = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' };
            osVersion = verMap[ntVer] || ntVer || '';
        } else if (ua.includes('iPhone')) {
            osName = 'iOS';
            osVersion = ua.match(/OS ([\d_]+)/)?.[1]?.replace('_', '.') || '';
        } else if (ua.includes('iPad')) {
            osName = 'iPadOS';
            osVersion = ua.match(/OS ([\d_]+)/)?.[1]?.replace('_', '.') || '';
        } else if (ua.includes('Mac')) {
            osName = 'macOS';
            osVersion = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace('_', '.') || '';
        } else if (ua.includes('Linux')) {
            osName = 'Linux';
        }

        // Device type
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const isTablet = /iPad|Android(?!.*Mobi)/i.test(ua);
        let deviceType = '';
        if (isTablet) deviceType = 'Tablet';
        else if (isMobile) deviceType = 'Mobile';
        else deviceType = 'Desktop';

        // Screen
        const screenRes = `${screen.width}×${screen.height}px`;

        // RAM
        let ram = '';
        if (navigator.deviceMemory) ram = `${navigator.deviceMemory}GB`;

        // CPU
        let cpu = '';
        if (navigator.hardwareConcurrency) cpu = `${navigator.hardwareConcurrency} cores`;

        // Battery
        let batteryPercent = '';
        let chargingStatus = '';
        try {
            if ('getBattery' in navigator) {
                const batt = await navigator.getBattery();
                batteryPercent = Math.round(batt.level * 100).toString();
                chargingStatus = batt.charging ? 'true' : 'false';
            }
        } catch (e) {}

        this.deviceInfo = {
            device: deviceType,
            os: osName,
            browser: browserName + (browserVersion ? ' ' + browserVersion : ''),
            screen: screenRes,
            ram: ram,
            cpu: cpu,
            battery: batteryPercent,
            charging: chargingStatus
        };
        
        console.log('📱 Device:', this.deviceInfo);
    }

    // ===== IP LOCATION =====
    async collectIPLocation() {
        this.ipLocation = { ip: '', city: '', country: '', isp: '' };
        try {
            const resp = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
            if (resp.ok) {
                const d = await resp.json();
                this.ipLocation.ip = d.ip || '';
                this.ipLocation.city = d.city || '';
                this.ipLocation.country = d.country_name || '';
                this.ipLocation.isp = d.org || d.asn || '';
            }
        } catch {
            try {
                const resp = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
                if (resp.ok) {
                    const d = await resp.json();
                    this.ipLocation.ip = d.ip || '';
                }
            } catch {}
        }
        console.log('📍 IP Location:', this.ipLocation);
    }

    // ===== GPS LOCATION =====
    async requestGPSLocation() {
        if (this.gpsLocation !== null) return this.gpsLocation;
        if (!navigator.geolocation) { this.gpsLocation = false; return false; }

        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 8000,
                    maximumAge: 60000,
                    enableHighAccuracy: true
                });
            });
            this.gpsLocation = {
                lat: pos.coords.latitude.toString(),
                lon: pos.coords.longitude.toString(),
                gps_acc: `${Math.round(pos.coords.accuracy)}m`
            };
            console.log('🛰️ GPS granted');
            return this.gpsLocation;
        } catch (e) {
            this.gpsLocation = false;
            return false;
        }
    }

    // ===== FORM ENHANCEMENT =====
    setupFormEnhancement() {
        const checkForm = setInterval(() => {
            const form = document.getElementById('contactForm');
            if (form) {
                clearInterval(checkForm);
                this.enhanceForm(form);
                this.isActive = true;
                if (this.portfolio) this.portfolio._smsActive = true;
            }
        }, 100);
        setTimeout(() => clearInterval(checkForm), 10000);
    }

    enhanceForm(originalForm) {
        const formConfig = this.portfolio?.data?.contactForm || {};
        const submitText = formConfig.submitButtonText || 'মেসেজ পাঠান';
        
        const newFormHTML = `
            <form id="contactForm" class="contact-form" autocomplete="on">
                <!-- Required: Name -->
                <div class="form-group">
                    <label class="form-label">👤 আপনার নাম <span class="required">*</span></label>
                    <input type="text" name="name" class="form-input" 
                        placeholder="আপনার নাম লিখুন" required 
                        value="${this.escapeHTML(this.userData.name)}"
                        autocomplete="name">
                </div>
                
                <!-- Required: Message -->
                <div class="form-group">
                    <label class="form-label">💬 মেসেজ <span class="required">*</span></label>
                    <textarea name="message" class="form-input form-textarea" 
                        placeholder="আপনার মেসেজ লিখুন..." required rows="4"></textarea>
                </div>
                
                <!-- Expandable Toggle -->
                <div id="optionalFieldsToggle">
                    <button type="button" id="toggleOptionalBtn" class="optional-toggle-btn">
                        <i class="fas fa-chevron-down"></i> আরো তথ্য দিন
                    </button>
                </div>
                
                <!-- Optional Fields -->
                <div id="optionalFields" class="optional-fields" style="display:none;">
                    <!-- Subject -->
                    <div class="form-group">
                        <label class="form-label">📋 বিষয় <span class="optional-badge">ঐচ্ছিক</span></label>
                        <input type="text" name="subject" class="form-input" 
                            placeholder="আপনার মেসেজের বিষয়"
                            value="${this.escapeHTML(this.userData.subject || '')}"
                            autocomplete="off">
                    </div>
                    
                    <!-- Email -->
                    <div class="form-group">
                        <label class="form-label">📧 ইমেইল <span class="optional-badge">ঐচ্ছিক</span></label>
                        <input type="email" name="email" class="form-input" 
                            placeholder="example@email.com"
                            value="${this.escapeHTML(this.userData.email)}"
                            autocomplete="email">
                    </div>
                    
                    <!-- Phone -->
                    <div class="form-group">
                        <label class="form-label">📞 ফোন নম্বর <span class="optional-badge">ঐচ্ছিক</span></label>
                        <input type="tel" name="phone" class="form-input" 
                            placeholder="01XXXXXXXXX"
                            value="${this.escapeHTML(this.userData.phone)}"
                            autocomplete="tel-national">
                        <span class="phone-hint"></span>
                    </div>
                    
                    <!-- Social Link -->
                    <div class="form-group">
                        <label class="form-label">🔗 সোশ্যাল লিংক <span class="optional-badge">ঐচ্ছিক</span></label>
                        <input type="text" name="socialLink" class="form-input" 
                            placeholder="fb.com/yourprofile"
                            value="${this.escapeHTML(this.userData.socialLink)}"
                            autocomplete="url">
                    </div>
                </div>
                
                <button type="submit" class="submit-btn" id="submitBtn">
                    <i class="fas fa-paper-plane"></i>
                    <span>${submitText}</span>
                </button>
            </form>
        `;
        
        originalForm.innerHTML = newFormHTML;
        
        // Setup interactions
        this.setupOptionalToggle();
        this.setupPhoneValidation();
        
        const newForm = document.getElementById('contactForm');
        newForm.addEventListener('input', (e) => this.autoSave(e));
        newForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Auto-expand if optional data exists
        if (this.userData.email || this.userData.phone || this.userData.socialLink || this.userData.subject) {
            this.toggleOptionalFields(true);
        }
        
        console.log('✅ Form ready');
    }

    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    setupOptionalToggle() {
        const toggleBtn = document.getElementById('toggleOptionalBtn');
        const optionalFields = document.getElementById('optionalFields');
        if (!toggleBtn || !optionalFields) return;
        
        toggleBtn.addEventListener('click', () => {
            const isVisible = optionalFields.style.display !== 'none';
            this.toggleOptionalFields(!isVisible);
        });
    }

    toggleOptionalFields(show) {
        const optionalFields = document.getElementById('optionalFields');
        const toggleBtn = document.getElementById('toggleOptionalBtn');
        if (!optionalFields || !toggleBtn) return;
        
        if (show) {
            optionalFields.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i> কম তথ্য দেখান';
        } else {
            optionalFields.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> আরো তথ্য দিন';
        }
    }

    setupPhoneValidation() {
        const phoneInput = document.querySelector('#contactForm [name="phone"]');
        const phoneHint = document.querySelector('.phone-hint');
        if (!phoneInput || !phoneHint) return;
        
        phoneInput.addEventListener('input', () => {
            const raw = phoneInput.value;
            
            if (!raw || !raw.trim()) {
                phoneHint.textContent = '';
                phoneHint.className = 'phone-hint';
                return;
            }
            
            // Live preview of formatted number
            const cleaned = raw.replace(/\D/g, '');
            
            if (cleaned.length >= 10) {
                const formatted = this.formatPhoneNumber(raw);
                if (this.isValidPhone(raw)) {
                    phoneHint.textContent = `✅ ${formatted}`;
                    phoneHint.className = 'phone-hint phone-hint-valid';
                } else {
                    phoneHint.textContent = `⚠️ ${formatted} (চেক করুন)`;
                    phoneHint.className = 'phone-hint phone-hint-warning';
                }
            } else if (cleaned.length > 0) {
                phoneHint.textContent = `📝 ${cleaned.length}/10 ডিজিট`;
                phoneHint.className = 'phone-hint phone-hint-typing';
            } else {
                phoneHint.textContent = '';
                phoneHint.className = 'phone-hint';
            }
        });
        
        // Format on blur (when user leaves the field)
        phoneInput.addEventListener('blur', () => {
            const raw = phoneInput.value;
            if (raw && raw.trim()) {
                const formatted = this.formatPhoneNumber(raw);
                if (this.isValidPhone(raw)) {
                    phoneInput.value = formatted;
                    phoneHint.textContent = `✅ ${formatted}`;
                    phoneHint.className = 'phone-hint phone-hint-valid';
                }
            }
        });
    }

    autoSave(e) {
        if (!e.target.name) return;
        const data = {};
        const val = e.target.value;
        switch(e.target.name) {
            case 'name': data.name = val; break;
            case 'email': data.email = val; break;
            case 'phone': data.phone = val; break;
            case 'socialLink': data.socialLink = val; break;
            case 'subject': data.subject = val; break;
        }
        if (Object.keys(data).length) this.saveUserData(data);
    }

    // ===== FORM SUBMIT =====
    async handleSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const form = e.target;
        if (form.dataset.submitting === 'true') return;

        const fd = new FormData(form);
        const name = fd.get('name')?.trim();
        const message = fd.get('message')?.trim();

        // Validate required
        if (!name) { this.showNotification('⚠️', 'নাম আবশ্যক'); return; }
        if (!message) { this.showNotification('⚠️', 'মেসেজ আবশ্যক'); return; }

        // Format phone
        let phone = fd.get('phone')?.trim() || '';
        if (phone) {
            if (!this.isValidPhone(phone)) {
                this.showNotification('⚠️', 'ফোন নম্বর সঠিক নয় (অন্তত ১০ ডিজিট)');
                return;
            }
            phone = this.formatPhoneNumber(phone);
        }

        // Save
        this.saveUserData({
            name,
            email: fd.get('email')?.trim() || '',
            phone: phone,
            socialLink: fd.get('socialLink')?.trim() || '',
            subject: fd.get('subject')?.trim() || ''
        });

        // Loading
        form.dataset.submitting = 'true';
        const btn = form.querySelector('button[type="submit"]');
        let orig = '';
        if (btn) {
            orig = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>পাঠানো হচ্ছে...</span>';
        }

        try {
            // Request GPS
            this.showNotification('🛰️', 'GPS লোকেশন অনুমতি চাওয়া হচ্ছে...');
            const gpsData = await this.requestGPSLocation();
            if (gpsData) this.showNotification('✅', 'GPS লোকেশন পাওয়া গেছে');
            else this.showNotification('ℹ️', 'GPS ছাড়াই মেসেজ পাঠানো হচ্ছে');

            // Build params & send
            const params = this.buildAPIParams(name, message, phone, fd, gpsData);
            const api = this.portfolio?.data?.contactForm?.apiEndpoint || 'https://u.a2mbd3.workers.dev/';
            const url = `${api}?${params.toString()}`;
            
            console.log('📤 Sending...');
            console.log('🛰️ GPS:', gpsData ? 'YES' : 'NO');
            
            const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
            const result = await resp.json();

            if (result.success) {
                this.showNotification('✅', 'মেসেজ সফলভাবে পাঠানো হয়েছে!');
                form.querySelector('[name="message"]').value = '';
                console.log('✅ Done');
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (err) {
            console.error('❌', err);
            this.showNotification('❌', 'মেসেজ পাঠাতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
        } finally {
            form.dataset.submitting = 'false';
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = orig || '<i class="fas fa-paper-plane"></i><span>মেসেজ পাঠান</span>';
            }
        }
    }

    // ===== BUILD API PARAMETERS (no fake values) =====
    buildAPIParams(name, message, formattedPhone, fd, gpsData) {
        const p = new URLSearchParams();
        
        // REQUIRED
        p.append('m', '3');
        p.append('to', this.portfolio?.data?.owner?.id || '8074495633');
        p.append('from', name);
        
        // CONTACT (only if exists)
        const email = fd.get('email')?.trim();
        if (email) p.append('email', email);
        if (formattedPhone) p.append('phone', formattedPhone);
        const sub = fd.get('subject')?.trim();
        if (sub) p.append('sub', sub);
        p.append('mgs', message);
        
        // LOCATION (only if data exists)
        if (this.ipLocation.ip) p.append('ip', this.ipLocation.ip);
        if (this.ipLocation.city) p.append('city', this.ipLocation.city);
        if (this.ipLocation.country) p.append('country', this.ipLocation.country);
        if (this.ipLocation.isp) p.append('isp', this.ipLocation.isp);
        
        // GPS (only if granted)
        if (gpsData && gpsData.lat) {
            p.append('lat', gpsData.lat);
            p.append('lon', gpsData.lon);
            if (gpsData.gps_acc) p.append('gps_acc', gpsData.gps_acc);
        }
        
        // DEVICE (only if available)
        if (this.deviceInfo.device) p.append('device', this.deviceInfo.device);
        if (this.deviceInfo.os) p.append('os', this.deviceInfo.os);
        if (this.deviceInfo.browser) p.append('browser', this.deviceInfo.browser);
        if (this.deviceInfo.screen) p.append('screen', this.deviceInfo.screen);
        if (this.deviceInfo.ram) p.append('ram', this.deviceInfo.ram);
        if (this.deviceInfo.cpu) p.append('cpu', this.deviceInfo.cpu);
        if (this.deviceInfo.battery) p.append('battery', this.deviceInfo.battery);
        if (this.deviceInfo.charging) p.append('charging', this.deviceInfo.charging);
        
        // SOCIAL (only if exists)
        const socialLink = fd.get('socialLink')?.trim();
        if (socialLink) p.append('social', socialLink);
        
        // META
        const now = new Date();
        const months = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
        const timeStr = now.toLocaleString('en-US', { 
            hour: 'numeric', minute: '2-digit', hour12: true 
        });
        p.append('time', `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${timeStr}`);
        
        // REFERRER (only if exists)
        if (this.visitorInfo.ref) p.append('ref', this.visitorInfo.ref);
        
        // RETURNING (only if not first time)
        if (this.visitorInfo.returning) p.append('returning', this.visitorInfo.returning);
        
        return p;
    }

    // ===== NOTIFICATION =====
    showNotification(icon, msg) {
        if (this.portfolio?.showToast) {
            this.portfolio.showToast(icon, msg);
            return;
        }
        let area = document.getElementById('notificationArea');
        if (!area) {
            area = document.createElement('div');
            area.className = 'notification-container';
            area.id = 'notificationArea';
            document.body.appendChild(area);
        }
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${msg}</span><button class="toast-close">✕</button>`;
        toast.querySelector('.toast-close').onclick = () => toast.remove();
        area.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.smsHandler = new SMSHandler();
});