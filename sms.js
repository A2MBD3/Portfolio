// ===== SMS Handler v8 - Mode 3 API | Default: Name+Subject+Message =====
class SMSHandler {
    constructor() {
        this.storageKey = 'portfolio_user_data_v8';
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
        
        console.log('📱 SMS Handler v8 initialized');
    }

    // ===== LOCAL STORAGE (only email, phone, socialLink) =====
    loadUserData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : { email: '', phone: '', socialLink: '' };
        } catch (e) {
            return { email: '', phone: '', socialLink: '' };
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
        let digits = raw.replace(/\D/g, '');
        if (digits.startsWith('880')) digits = digits.substring(3);
        else if (digits.startsWith('88')) digits = digits.substring(2);
        else if (digits.startsWith('00880')) digits = digits.substring(5);
        else if (digits.startsWith('0088')) digits = digits.substring(4);
        if (digits.startsWith('0') && digits.length === 11) digits = digits.substring(1);
        if (digits.length === 10) return '0' + digits;
        if (digits.length === 11 && digits.startsWith('0')) return digits;
        if (digits.length === 11 && !digits.startsWith('0')) return '0' + digits;
        if (digits.length > 11) { digits = digits.slice(-10); return '0' + digits; }
        return digits;
    }

    isValidPhone(raw) {
        if (!raw || !raw.trim()) return false;
        return /^01\d{9}$/.test(this.formatPhoneNumber(raw));
    }

    // ===== VISITOR INFO =====
    collectVisitorInfo() {
        const ref = document.referrer || '';
        let refDomain = '';
        try {
            if (ref && ref !== '') refDomain = new URL(ref).hostname.replace('www.', '');
        } catch { refDomain = ref; }
        const key = 'portfolio_visit_count_v8';
        let count = parseInt(localStorage.getItem(key) || '0');
        count++;
        localStorage.setItem(key, count.toString());
        this.visitorInfo = {
            ref: refDomain,
            returning: count > 1 ? `${count}th time` : ''
        };
    }

    // ===== DEVICE INFO =====
    async collectDeviceInfo() {
        const ua = navigator.userAgent;
        let browserName = '', browserVersion = '';
        if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR') && !ua.includes('SamsungBrowser')) {
            browserName = 'Chrome'; browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || '';
        } else if (ua.includes('SamsungBrowser')) {
            browserName = 'Samsung Browser'; browserVersion = ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] || '';
        } else if (ua.includes('Firefox')) {
            browserName = 'Firefox'; browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || '';
        } else if (ua.includes('Edg')) {
            browserName = 'Edge'; browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || '';
        } else if (ua.includes('OPR') || ua.includes('Opera')) {
            browserName = 'Opera'; browserVersion = ua.match(/OPR\/([\d.]+)/)?.[1] || '';
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browserName = 'Safari'; browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || '';
        }

        let osName = '', osVersion = '';
        if (ua.includes('Android')) {
            osName = 'Android'; osVersion = ua.match(/Android\s([\d.]+)/)?.[1] || '';
            const brands = ['Samsung','Xiaomi','Redmi','POCO','OPPO','vivo','OnePlus','Realme','Huawei','Honor','Infinix','Tecno','Nokia','Motorola','Google'];
            for (const b of brands) { if (ua.includes(b)) { osName = `Android ${osVersion} (${b})`; break; } }
            if (osName === 'Android') osName = `Android ${osVersion}`;
        } else if (ua.includes('Windows')) {
            osName = 'Windows'; const nt = ua.match(/Windows NT ([\d.]+)/)?.[1]; const m = {'10.0':'10/11','6.3':'8.1','6.2':'8','6.1':'7'}; osVersion = m[nt] || nt || '';
        } else if (ua.includes('iPhone')) { osName = 'iOS'; osVersion = ua.match(/OS ([\d_]+)/)?.[1]?.replace('_','.') || ''; }
        else if (ua.includes('iPad')) { osName = 'iPadOS'; osVersion = ua.match(/OS ([\d_]+)/)?.[1]?.replace('_','.') || ''; }
        else if (ua.includes('Mac')) { osName = 'macOS'; osVersion = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace('_','.') || ''; }
        else if (ua.includes('Linux')) osName = 'Linux';

        const isMob = /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const isTab = /iPad|Android(?!.*Mobi)/i.test(ua);
        let devType = isTab ? 'Tablet' : (isMob ? 'Mobile' : 'Desktop');

        let ram = '', cpu = '', bat = '', chg = '';
        if (navigator.deviceMemory) ram = `${navigator.deviceMemory}GB`;
        if (navigator.hardwareConcurrency) cpu = `${navigator.hardwareConcurrency} cores`;
        try { if ('getBattery' in navigator) { const bt = await navigator.getBattery(); bat = Math.round(bt.level*100).toString(); chg = bt.charging?'true':'false'; } } catch(e){}

        this.deviceInfo = { device:devType, os:osName, browser:browserName+(browserVersion?' '+browserVersion:''), screen:`${screen.width}×${screen.height}px`, ram, cpu, battery:bat, charging:chg };
        console.log('📱 Device:', this.deviceInfo);
    }

    // ===== IP LOCATION =====
    async collectIPLocation() {
        this.ipLocation = { ip:'', city:'', country:'', isp:'' };
        try {
            const r = await fetch('https://ipapi.co/json/',{signal:AbortSignal.timeout(5000)});
            if(r.ok){const d=await r.json();this.ipLocation.ip=d.ip||'';this.ipLocation.city=d.city||'';this.ipLocation.country=d.country_name||'';this.ipLocation.isp=d.org||d.asn||'';}
        }catch{
            try{const r=await fetch('https://api.ipify.org?format=json',{signal:AbortSignal.timeout(3000)});if(r.ok){const d=await r.json();this.ipLocation.ip=d.ip||'';}}catch{}
        }
        console.log('📍 IP:', this.ipLocation);
    }

    // ===== GPS =====
    async requestGPSLocation() {
        if(this.gpsLocation!==null)return this.gpsLocation;
        if(!navigator.geolocation){this.gpsLocation=false;return false;}
        try{
            const pos=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:8000,maximumAge:60000,enableHighAccuracy:true}));
            this.gpsLocation={lat:pos.coords.latitude.toString(),lon:pos.coords.longitude.toString(),gps_acc:`${Math.round(pos.coords.accuracy)}m`};
            return this.gpsLocation;
        }catch(e){this.gpsLocation=false;return false;}
    }

    // ===== FORM =====
    setupFormEnhancement() {
        const check = setInterval(() => {
            const form = document.getElementById('contactForm');
            if (form) { clearInterval(check); this.enhanceForm(form); this.isActive = true; if(this.portfolio)this.portfolio._smsActive=true; }
        }, 100);
        setTimeout(() => clearInterval(check), 10000);
    }

    enhanceForm(originalForm) {
        const submitText = this.portfolio?.data?.contactForm?.submitButtonText || 'মেসেজ পাঠান';
        const hasOptionalData = this.userData.email || this.userData.phone || this.userData.socialLink;
        
        originalForm.innerHTML = `
            <form id="contactForm" class="contact-form" autocomplete="on">
                <div class="form-group">
                    <label class="form-label">👤 আপনার নাম <span class="required">*</span></label>
                    <input type="text" name="name" class="form-input" placeholder="আপনার নাম লিখুন" required autocomplete="name">
                </div>
                
                <div class="form-group">
                    <label class="form-label">📋 বিষয় <span class="required">*</span></label>
                    <input type="text" name="subject" class="form-input" placeholder="আপনার মেসেজের বিষয়" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">💬 মেসেজ <span class="required">*</span></label>
                    <textarea name="message" class="form-input form-textarea" placeholder="আপনার মেসেজ লিখুন..." required rows="4"></textarea>
                </div>
                
                <div id="optionalFieldsToggle">
                    <button type="button" id="toggleOptionalBtn" class="optional-toggle-btn">
                        <i class="fas fa-chevron-${hasOptionalData ? 'up' : 'down'}"></i> আরো তথ্য দিন
                    </button>
                </div>
                
                <div id="optionalFields" class="optional-fields" style="display:${hasOptionalData ? 'block' : 'none'};">
                    <div class="form-group">
                        <label class="form-label">📧 ইমেইল <span class="optional-badge">ঐচ্ছিক</span></label>
                        <input type="email" name="email" class="form-input" placeholder="example@email.com" value="${this.esc(this.userData.email)}" autocomplete="email">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">📞 ফোন নম্বর <span class="optional-badge">ঐচ্ছিক</span></label>
                        <input type="tel" name="phone" class="form-input" placeholder="01XXXXXXXXX" value="${this.esc(this.userData.phone)}" autocomplete="tel-national">
                        <span class="phone-hint"></span>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">🔗 সোশ্যাল লিংক <span class="optional-badge">ঐচ্ছিক</span></label>
                        <input type="text" name="socialLink" class="form-input" placeholder="fb.com/yourprofile" value="${this.esc(this.userData.socialLink)}" autocomplete="url">
                    </div>
                </div>
                
                <button type="submit" class="submit-btn" id="submitBtn">
                    <i class="fas fa-paper-plane"></i>
                    <span>${submitText}</span>
                </button>
            </form>
        `;

        this.setupToggle();
        this.setupPhone();
        
        const newForm = document.getElementById('contactForm');
        newForm.addEventListener('input', (e) => this.autoSave(e));
        newForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        console.log('✅ Form ready (Default: Name+Subject+Message)');
    }

    esc(s) { if(!s)return''; const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

    setupToggle() {
        const btn = document.getElementById('toggleOptionalBtn');
        const fields = document.getElementById('optionalFields');
        if(!btn||!fields)return;
        btn.addEventListener('click',()=>{
            const show = fields.style.display === 'none';
            fields.style.display = show ? 'block' : 'none';
            btn.innerHTML = show ? '<i class="fas fa-chevron-up"></i> কম তথ্য দেখান' : '<i class="fas fa-chevron-down"></i> আরো তথ্য দিন';
        });
    }

    setupPhone() {
        const inp = document.querySelector('#contactForm [name="phone"]');
        const hint = document.querySelector('.phone-hint');
        if(!inp||!hint)return;
        inp.addEventListener('input',()=>{
            const raw = inp.value;
            if(!raw||!raw.trim()){hint.textContent='';hint.className='phone-hint';return;}
            const cleaned = raw.replace(/\D/g,'');
            if(cleaned.length>=10){
                const f = this.formatPhoneNumber(raw);
                if(this.isValidPhone(raw)){hint.textContent=`✅ ${f}`;hint.className='phone-hint phone-hint-valid';}
                else{hint.textContent=`⚠️ ${f} (চেক করুন)`;hint.className='phone-hint phone-hint-warning';}
            }else if(cleaned.length>0){hint.textContent=`📝 ${cleaned.length}/10 ডিজিট`;hint.className='phone-hint phone-hint-typing';}
            else{hint.textContent='';hint.className='phone-hint';}
        });
        inp.addEventListener('blur',()=>{
            const raw = inp.value;
            if(raw&&raw.trim()&&this.isValidPhone(raw)){inp.value=this.formatPhoneNumber(raw);hint.textContent=`✅ ${inp.value}`;hint.className='phone-hint phone-hint-valid';}
        });
    }

    autoSave(e) {
        if(!e.target.name)return;
        const data = {};
        switch(e.target.name){
            case 'email': data.email = e.target.value; break;
            case 'phone': data.phone = e.target.value; break;
            case 'socialLink': data.socialLink = e.target.value; break;
        }
        if(Object.keys(data).length) this.saveUserData(data);
    }

    // ===== SUBMIT =====
    async handleSubmit(e) {
        e.preventDefault(); e.stopPropagation();
        const form = e.target;
        if(form.dataset.submitting==='true')return;

        const fd = new FormData(form);
        const name = fd.get('name')?.trim();
        const subject = fd.get('subject')?.trim();
        const message = fd.get('message')?.trim();

        if(!name){this.showNotification('⚠️','নাম আবশ্যক');return;}
        if(!subject){this.showNotification('⚠️','বিষয় আবশ্যক');return;}
        if(!message){this.showNotification('⚠️','মেসেজ আবশ্যক');return;}

        let phone = fd.get('phone')?.trim()||'';
        if(phone){
            if(!this.isValidPhone(phone)){this.showNotification('⚠️','ফোন নম্বর সঠিক নয়');return;}
            phone = this.formatPhoneNumber(phone);
        }

        // Save only email, phone, socialLink (NOT subject)
        this.saveUserData({
            email: fd.get('email')?.trim()||'',
            phone: phone,
            socialLink: fd.get('socialLink')?.trim()||''
        });

        form.dataset.submitting='true';
        const btn = form.querySelector('button[type="submit"]');
        let orig='';
        if(btn){orig=btn.innerHTML;btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i><span>পাঠানো হচ্ছে...</span>';}

        try{
            this.showNotification('🛰️','GPS লোকেশন অনুমতি চাওয়া হচ্ছে...');
            const gps = await this.requestGPSLocation();
            if(gps)this.showNotification('✅','GPS লোকেশন পাওয়া গেছে');
            else this.showNotification('ℹ️','GPS ছাড়াই পাঠানো হচ্ছে');

            const params = this.buildParams(name, subject, message, phone, fd, gps);
            const api = this.portfolio?.data?.contactForm?.apiEndpoint || 'https://u.a2mbd3.workers.dev/';
            const url = `${api}?${params.toString()}`;
            
            console.log('📤 Sending... GPS:', gps?'YES':'NO');
            const resp = await fetch(url,{method:'GET',headers:{'Accept':'application/json'}});
            const result = await resp.json();

            if(result.success){
                this.showNotification('✅','মেসেজ সফলভাবে পাঠানো হয়েছে!');
                form.querySelector('[name="message"]').value = '';
                form.querySelector('[name="subject"]').value = '';
            }else throw new Error(result.error||'Unknown');
        }catch(err){
            console.error('❌',err);
            this.showNotification('❌','মেসেজ পাঠাতে ব্যর্থ হয়েছে');
        }finally{
            form.dataset.submitting='false';
            if(btn){btn.disabled=false;btn.innerHTML=orig||'<i class="fas fa-paper-plane"></i><span>মেসেজ পাঠান</span>';}
        }
    }

    buildParams(name, subject, message, phone, fd, gps) {
        const p = new URLSearchParams();
        p.append('m','3');
        p.append('to',this.portfolio?.data?.owner?.id||'8074495633');
        p.append('from',name);
        p.append('sub',subject);
        p.append('mgs',message);
        
        const email = fd.get('email')?.trim();
        if(email)p.append('email',email);
        if(phone)p.append('phone',phone);
        
        if(this.ipLocation.ip)p.append('ip',this.ipLocation.ip);
        if(this.ipLocation.city)p.append('city',this.ipLocation.city);
        if(this.ipLocation.country)p.append('country',this.ipLocation.country);
        if(this.ipLocation.isp)p.append('isp',this.ipLocation.isp);
        
        if(gps&&gps.lat){
            p.append('lat',gps.lat);
            p.append('lon',gps.lon);
            if(gps.gps_acc)p.append('gps_acc',gps.gps_acc);
        }
        
        if(this.deviceInfo.device)p.append('device',this.deviceInfo.device);
        if(this.deviceInfo.os)p.append('os',this.deviceInfo.os);
        if(this.deviceInfo.browser)p.append('browser',this.deviceInfo.browser);
        if(this.deviceInfo.screen)p.append('screen',this.deviceInfo.screen);
        if(this.deviceInfo.ram)p.append('ram',this.deviceInfo.ram);
        if(this.deviceInfo.cpu)p.append('cpu',this.deviceInfo.cpu);
        if(this.deviceInfo.battery)p.append('battery',this.deviceInfo.battery);
        if(this.deviceInfo.charging)p.append('charging',this.deviceInfo.charging);
        
        const social = fd.get('socialLink')?.trim();
        if(social)p.append('social',social);
        
        const now = new Date();
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        p.append('time',`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${now.toLocaleString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})}`);
        if(this.visitorInfo.ref)p.append('ref',this.visitorInfo.ref);
        if(this.visitorInfo.returning)p.append('returning',this.visitorInfo.returning);
        
        return p;
    }

    showNotification(icon, msg) {
        if(this.portfolio?.showToast){this.portfolio.showToast(icon,msg);return;}
        let area = document.getElementById('notificationArea');
        if(!area){area=document.createElement('div');area.className='notification-container';area.id='notificationArea';document.body.appendChild(area);}
        const toast = document.createElement('div');
        toast.className='notification-toast';
        toast.innerHTML=`<span class="toast-icon">${icon}</span><span class="toast-msg">${msg}</span><button class="toast-close">✕</button>`;
        toast.querySelector('.toast-close').onclick=()=>toast.remove();
        area.appendChild(toast);
        setTimeout(()=>{if(toast.parentNode)toast.remove();},5000);
    }
}

document.addEventListener('DOMContentLoaded',()=>{window.smsHandler=new SMSHandler();});