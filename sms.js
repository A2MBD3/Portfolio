// ===== SMS Handler v5 - Mode 3 API with Conditional GPS =====
class SMSHandler {
    constructor() {
        this.storageKey = 'portfolio_user_data_v5';
        this.userData = this.loadUserData();
        this.deviceInfo = {};
        this.ipLocation = {};
        this.gpsLocation = null; // null = not attempted, false = denied, object = granted
        this.visitorInfo = {};
        this.isActive = false;
        this.init();
    }

    async init() {
        // Collect device info immediately (no permission needed)
        await this.collectDeviceInfo();
        
        // Collect IP-based location (no permission needed)
        await this.collectIPLocation();
        
        // Collect visitor info
        this.collectVisitorInfo();
        
        // Wait for portfolio to be ready
        document.addEventListener('portfolioReady', (e) => {
            this.portfolio = e.detail;
            this.setupFormEnhancement();
        });
        
        if (window.dynamicPortfolio) {
            this.portfolio = window.dynamicPortfolio;
            this.setupFormEnhancement();
        }
        
        console.log('📱 SMS Handler v5 initialized (Mode 3 API)');
    }

    // ===== LOCAL STORAGE =====
    loadUserData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {
                name: '', email: '', phone: '', socialLink: ''
            };
        } catch (e) {
            return { name: '', email: '', phone: '', socialLink: '' };
        }
    }

    saveUserData(data) {
        try {
            this.userData = { ...this.userData, ...data };
            localStorage.setItem(this.storageKey, JSON.stringify(this.userData));
        } catch (e) {}
    }

    // ===== VISITOR INFO =====
    collectVisitorInfo() {
        const ref = document.referrer || '';
        let refDomain = 'direct';
        try {
            if (ref && ref !== '') {
                refDomain = new URL(ref).hostname.replace('www.', '');
            }
        } catch { refDomain = ref; }

        const visitCount = this.getVisitCount();
        
        this.visitorInfo = {
            ref: refDomain,
            returning: visitCount > 1 ? `${visitCount}th time` : 'first time',
            adblock: this.detectAdblock()
        };
    }

    getVisitCount() {
        const key = 'portfolio_visit_count_v5';
        let count = parseInt(localStorage.getItem(key) || '0');
        count++;
        localStorage.setItem(key, count.toString());
        return count;
    }

    detectAdblock() {
        try {
            const test = document.createElement('div');
            test.className = 'adsbox';
            test.innerHTML = '&nbsp;';
            test.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
            document.body.appendChild(test);
            const blocked = test.offsetHeight === 0;
            document.body.removeChild(test);
            return blocked;
        } catch { return false; }
    }

    // ===== DEVICE INFO =====
    async collectDeviceInfo() {
        const ua = navigator.userAgent;
        
        // Browser detection
        let browserName = 'Unknown', browserVersion = 'Unknown';
        if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR') && !ua.includes('SamsungBrowser')) {
            browserName = 'Chrome';
            browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || 'Unknown';
        } else if (ua.includes('SamsungBrowser')) {
            browserName = 'Samsung Browser';
            browserVersion = ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Firefox')) {
            browserName = 'Firefox';
            browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Edg')) {
            browserName = 'Edge';
            browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || 'Unknown';
        } else if (ua.includes('OPR') || ua.includes('Opera')) {
            browserName = 'Opera';
            browserVersion = ua.match(/OPR\/([\d.]+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browserName = 'Safari';
            browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || 'Unknown';
        }

        // OS detection
        let osName = 'Unknown', osVersion = 'Unknown';
        if (ua.includes('Android')) {
            osName = 'Android';
            osVersion = ua.match(/Android\s([\d.]+)/)?.[1] || 'Unknown';
            const brands = [
                { key: 'Samsung', name: 'Samsung' },
                { key: 'Xiaomi|Redmi|POCO', name: 'Xiaomi' },
                { key: 'OPPO', name: 'OPPO' },
                { key: 'vivo', name: 'vivo' },
                { key: 'OnePlus', name: 'OnePlus' },
                { key: 'Realme', name: 'Realme' },
                { key: 'Huawei|Honor', name: 'Huawei' },
                { key: 'Infinix', name: 'Infinix' },
                { key: 'Tecno', name: 'Tecno' },
                { key: 'Nokia', name: 'Nokia' },
                { key: 'Motorola', name: 'Motorola' },
                { key: 'Google', name: 'Google Pixel' }
            ];
            for (const brand of brands) {
                if (new RegExp(brand.key, 'i').test(ua)) {
                    osName = `Android ${osVersion} (${brand.name})`;
                    break;
                }
            }
            if (!osName.includes('(')) osName = `Android ${osVersion}`;
        } else if (ua.includes('Windows')) {
            osName = 'Windows';
            const ntVer = ua.match(/Windows NT ([\d.]+)/)?.[1];
            const verMap = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' };
            osVersion = verMap[ntVer] || ntVer || 'Unknown';
        } else if (ua.includes('iPhone')) {
            osName = 'iOS';
            osVersion = ua.match(/OS ([\d_]+)/)?.[1]?.replace('_', '.') || 'Unknown';
        } else if (ua.includes('iPad')) {
            osName = 'iPadOS';
            osVersion = ua.match(/OS ([\d_]+)/)?.[1]?.replace('_', '.') || 'Unknown';
        } else if (ua.includes('Mac')) {
            osName = 'macOS';
            osVersion = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace('_', '.') || 'Unknown';
        } else if (ua.includes('Linux')) {
            osName = 'Linux';
        }

        // Device type
        const isMobile = /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const isTablet = /iPad|Android(?!.*Mobi)/i.test(ua);
        let deviceType = 'Desktop';
        if (isTablet) deviceType = 'Tablet';
        else if (isMobile) deviceType = 'Mobile';

        // Screen
        const screenRes = `${screen.width}×${screen.height}px`;

        // RAM
        let ram = 'Unknown';
        if (navigator.deviceMemory) ram = `${navigator.deviceMemory}GB`;

        // CPU
        let cpu = 'Unknown';
        if (navigator.hardwareConcurrency) cpu = `${navigator.hardwareConcurrency} cores`;

        // Battery
        let batteryPercent = 'Unknown';
        let chargingStatus = 'false';
        try {
            if ('getBattery' in navigator) {
                const batt = await navigator.getBattery();
                batteryPercent = Math.round(batt.level * 100).toString();
                chargingStatus = batt.charging ? 'true' : 'false';
            }
        } catch (e) {
            console.log('Battery info not available');
        }

        this.deviceInfo = {
            device: deviceType,
            os: osName,
            browser: `${browserName} ${browserVersion}`,
            screen: screenRes,
            ram: ram,
            cpu: cpu,
            battery: batteryPercent,
            charging: chargingStatus
        };

        console.log('📱 Device info:', this.deviceInfo);
    }

    // ===== IP LOCATION (no permission needed) =====
    async collectIPLocation() {
        this.ipLocation = { 
            ip: '', city: '', country: '', isp: ''
        };

        try {
            const resp = await fetch('https://ipapi.co/json/', { 
                signal: AbortSignal.timeout(5000) 
            });
            if (resp.ok) {
                const d = await resp.json();
                this.ipLocation.ip = d.ip || '';
                this.ipLocation.city = d.city || '';
                this.ipLocation.country = d.country_name || '';
                this.ipLocation.isp = d.org || d.asn || '';
                console.log('📍 IP location:', this.ipLocation.city, this.ipLocation.country);
            }
        } catch {
            console.log('IP location API failed, trying backup...');
            try {
                const resp = await fetch('https://api.ipify.org?format=json', { 
                    signal: AbortSignal.timeout(3000) 
                });
                if (resp.ok) {
                    const d = await resp.json();
                    this.ipLocation.ip = d.ip || '';
                }
            } catch {
                console.log('All IP APIs failed');
            }
        }
    }

    // ===== GPS LOCATION (requests permission on form submit) =====
    async requestGPSLocation() {
        // If already attempted, return cached result
        if (this.gpsLocation !== null) {
            return this.gpsLocation;
        }

        if (!navigator.geolocation) {
            console.log('🛰️ Geolocation not supported');
            this.gpsLocation = false;
            return false;
        }

        try {
            console.log('🛰️ Requesting GPS permission...');
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
            
            console.log('🛰️ GPS granted:', this.gpsLocation);
            return this.gpsLocation;
        } catch (e) {
            console.log('🛰️ GPS denied/error:', e.message);
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

    enhanceForm(form) {
        this.ensureExtraFields(form);
        
        // Clone to remove old listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        this.fillSavedData(newForm);
        
        newForm.addEventListener('input', (e) => this.autoSave(e));
        newForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        console.log('✅ Form enhanced for Mode 3 API');
    }

    ensureExtraFields(form) {
        const existingNames = Array.from(form.querySelectorAll('[name]')).map(el => el.name);
        
        if (!existingNames.includes('phone')) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label class="form-label">📞 ফোন নম্বর <span style="color: var(--text-dim); font-size: 0.75rem;">(ঐচ্ছিক)</span></label>
                <input type="tel" name="phone" class="form-input" placeholder="01XXXXXXXXX" pattern="[0-9]{10,14}" autocomplete="tel">
            `;
            const btn = form.querySelector('button[type="submit"]');
            btn ? btn.parentNode.insertBefore(div, btn) : form.appendChild(div);
        }
        
        if (!existingNames.includes('socialLink')) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label class="form-label">🔗 সোশ্যাল লিংক <span style="color: var(--text-dim); font-size: 0.75rem;">(ঐচ্ছিক)</span></label>
                <input type="text" name="socialLink" class="form-input" placeholder="fb.com/yourprofile" autocomplete="url">
            `;
            const btn = form.querySelector('button[type="submit"]');
            btn ? btn.parentNode.insertBefore(div, btn) : form.appendChild(div);
        }
    }

    fillSavedData(form) {
        const map = {
            name: this.userData.name,
            email: this.userData.email,
            phone: this.userData.phone,
            socialLink: this.userData.socialLink
        };
        Object.entries(map).forEach(([name, value]) => {
            if (value) {
                const el = form.querySelector(`[name="${name}"]`);
                if (el && !el.value) el.value = value;
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
        }
        if (Object.keys(data).length) this.saveUserData(data);
    }

    // ===== FORM SUBMIT HANDLER =====
    async handleSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const form = e.target;
        if (form.dataset.submitting === 'true') return;

        const fd = new FormData(form);
        const name = fd.get('name')?.trim();
        const message = fd.get('message')?.trim();

        // Validate required fields
        if (!name) { 
            this.showNotification('⚠️', 'নাম আবশ্যক'); 
            return; 
        }
        if (!message) { 
            this.showNotification('⚠️', 'মেসেজ আবশ্যক'); 
            return; 
        }

        // Save user data
        this.saveUserData({
            name, 
            email: fd.get('email')?.trim() || '',
            phone: fd.get('phone')?.trim() || '',
            socialLink: fd.get('socialLink')?.trim() || ''
        });

        // Show loading state
        form.dataset.submitting = 'true';
        const btn = form.querySelector('button[type="submit"]');
        let orig = '';
        if (btn) { 
            orig = btn.innerHTML; 
            btn.disabled = true; 
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>পাঠানো হচ্ছে...</span>'; 
        }

        try {
            // Request GPS location (will show browser popup)
            this.showNotification('🛰️', 'GPS অনুমতি চাওয়া হচ্ছে...');
            const gpsData = await this.requestGPSLocation();
            
            if (gpsData) {
                this.showNotification('✅', 'অবস্থান তথ্য পাওয়া গেছে');
            } else {
                this.showNotification('⚠️', 'জিপিএস অনুমতি প্রত্যাখ্যান করা হয়েছে');
            }
            
            // Build API parameters
            const params = this.buildAPIParams(fd, gpsData);
            const api = this.portfolio?.data?.contactForm?.apiEndpoint || 'https://u.a2mbd3.workers.dev/';
            const url = `${api}?${params.toString()}`;
            
            console.log('📤 Sending to API (Mode 3)...');
            console.log('🔗 URL length:', url.length, 'characters');
            console.log('🛰️ GPS included:', gpsData ? 'YES' : 'NO');
            
            const resp = await fetch(url, { 
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            const result = await resp.json();

            if (result.success) {
                this.showNotification('✅', 'মেসেজ সফলভাবে পাঠানো হয়েছে!');
                // Reset only message and subject
                const msgInput = form.querySelector('[name="message"]');
                if (msgInput) msgInput.value = '';
                const subInput = form.querySelector('[name="subject"]');
                if (subInput) subInput.value = '';
                console.log('✅ Success:', result.data);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (err) {
            console.error('❌ Error:', err);
            this.showNotification('❌', 'মেসেজ পাঠাতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
        } finally {
            form.dataset.submitting = 'false';
            if (btn) { 
                btn.disabled = false; 
                btn.innerHTML = orig || '<i class="fas fa-paper-plane"></i><span>মেসেজ পাঠান</span>'; 
            }
        }
    }

    // ===== BUILD API PARAMETERS =====
    buildAPIParams(fd, gpsData) {
        const p = new URLSearchParams();
        
        // ───── REQUIRED (3) ─────
        p.append('m', '3');
        p.append('to', this.portfolio?.data?.owner?.id || '8074495633');
        p.append('from', fd.get('name')?.trim() || 'Anonymous');
        
        // ───── CONTACT (4) ─────
        const email = fd.get('email')?.trim();
        if (email) p.append('email', email);
        
        const phone = fd.get('phone')?.trim();
        if (phone) p.append('phone', phone);
        
        const sub = fd.get('subject')?.trim();
        if (sub) p.append('sub', sub);
        
        p.append('mgs', fd.get('message')?.trim() || '');
        
        // ───── LOCATION (7) ─────
        // IP-based location (always included if available)
        if (this.ipLocation.ip) p.append('ip', this.ipLocation.ip);
        if (this.ipLocation.city) p.append('city', this.ipLocation.city);
        if (this.ipLocation.country) p.append('country', this.ipLocation.country);
        if (this.ipLocation.isp) p.append('isp', this.ipLocation.isp);
        
        // GPS location (ONLY if user granted permission)
        if (gpsData && gpsData.lat) {
            p.append('lat', gpsData.lat);
            p.append('lon', gpsData.lon);
            if (gpsData.gps_acc) p.append('gps_acc', gpsData.gps_acc);
        }
        // If GPS denied → lat, lon, gps_acc parameters are NOT added
        
        // ───── DEVICE (8) ─────
        if (this.deviceInfo.device && this.deviceInfo.device !== 'Unknown') 
            p.append('device', this.deviceInfo.device);
        if (this.deviceInfo.os && this.deviceInfo.os !== 'Unknown') 
            p.append('os', this.deviceInfo.os);
        if (this.deviceInfo.browser && this.deviceInfo.browser !== 'Unknown') 
            p.append('browser', this.deviceInfo.browser);
        if (this.deviceInfo.screen && this.deviceInfo.screen !== 'Unknown') 
            p.append('screen', this.deviceInfo.screen);
        if (this.deviceInfo.ram && this.deviceInfo.ram !== 'Unknown') 
            p.append('ram', this.deviceInfo.ram);
        if (this.deviceInfo.cpu && this.deviceInfo.cpu !== 'Unknown') 
            p.append('cpu', this.deviceInfo.cpu);
        if (this.deviceInfo.battery && this.deviceInfo.battery !== 'Unknown') 
            p.append('battery', this.deviceInfo.battery);
        if (this.deviceInfo.charging) 
            p.append('charging', this.deviceInfo.charging);
        
        // ───── SOCIAL (1) ─────
        const socialLink = fd.get('socialLink')?.trim();
        if (socialLink) p.append('social', socialLink);
        
        // ───── VERIFICATION (4) ─────
        p.append('vpn', 'false');
        p.append('ip_gps', 'false');
        p.append('adblock', this.visitorInfo.adblock ? 'true' : 'false');
        p.append('returning', this.visitorInfo.returning || 'first time');
        
        // ───── META (2) ─────
        const now = new Date();
        const months = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
        const timeStr = now.toLocaleString('en-US', { 
            hour: 'numeric', minute: '2-digit', hour12: true 
        });
        p.append('time', `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${timeStr}`);
        p.append('ref', this.visitorInfo.ref || 'direct');
        
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
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-msg">${msg}</span>
            <button class="toast-close">✕</button>
        `;
        toast.querySelector('.toast-close').onclick = () => toast.remove();
        area.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    window.smsHandler = new SMSHandler();
});

console.log('📱 SMS Handler v5 loaded (GPS: Optional)');