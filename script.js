// --- 1. إعداد البيانات الأساسية ---
let appData = JSON.parse(localStorage.getItem('gyabi_data')) || null;

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    if (appData) {
        renderDashboard();
        showScreen('dashboard-view');
        document.getElementById('reset-session').classList.remove('hidden');
    } else {
        showScreen('onboarding-view');
    }
});

// دالة التنقل بين الشاشات
function showScreen(screenId) {
    const screens = ['onboarding-view', 'setup-view', 'dashboard-view'];
    screens.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

// --- 2. إدارة الوضع الليلي ---
function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerText = '☀️';
    }
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-toggle').innerText = isDark ? '☀️' : '🌙';
});

// --- 3. إعداد الحساب لأول مرة (Onboarding) ---
document.getElementById('start-app').addEventListener('click', () => {
    const name = document.getElementById('input-user-name').value.trim();
    if (!name) return alert("سجل اسمك يا دكتور، بلاش استعجال!");

    appData = {
        profile: {
            name: name,
            dept: document.getElementById('select-dept').value,
            level: document.getElementById('select-level').value
        },
        courses: []
    };
    
    renderScheduleInputs();
    showScreen('setup-view');
});

// --- 4. إعداد وتعديل الجدول ---
function renderScheduleInputs() {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    const container = document.getElementById('days-inputs-container');
    container.innerHTML = days.map(day => {
        // إذا كان هناك بيانات سابقة للمواد في هذا اليوم، نعرضها
        const existing = appData.courses.filter(c => c.day === day);
        return `
            <div class="day-input-group" style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                <h4 style="margin-bottom: 0.5rem; color: var(--primary); font-weight: 900;">📍 يوم ${day}</h4>
                ${[0, 1, 2].map(i => `
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <input type="text" class="course-name-in" data-day="${day}" placeholder="اسم المادة" value="${existing[i]?.name || ''}">
                        <input type="text" class="prof-name-in" placeholder="اسم الدكتور" value="${existing[i]?.prof || ''}">
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

document.getElementById('save-setup').addEventListener('click', () => {
    const names = document.querySelectorAll('.course-name-in');
    const profs = document.querySelectorAll('.prof-name-in');
    const newCourses = [];

    names.forEach((el, i) => {
        const name = el.value.trim();
        const prof = profs[i].value.trim();
        if (name) {
            // نحافظ على عدد الغيابات إذا كانت المادة موجودة مسبقاً
            const old = appData.courses.find(c => c.name === name);
            newCourses.push({
                name,
                prof: prof || "دكتور مجهول",
                day: el.dataset.day,
                absences: old ? old.absences : 0,
                reasons: old ? old.reasons : []
            });
        }
    });

    if (newCourses.length === 0) return alert("لازم تضيف مادة واحدة على الأقل عشان نراقبك!");
    
    appData.courses = newCourses;
    saveData();
    renderDashboard();
    showScreen('dashboard-view');
    document.getElementById('reset-session').classList.remove('hidden');
});

// فتح شاشة تعديل الجدول من الداش بورد
document.getElementById('edit-schedule-btn').addEventListener('click', () => {
    renderScheduleInputs();
    showScreen('setup-view');
});

// --- 5. لوحة التحكم والذكاء الاصطناعي (Dashboard & AI) ---
function renderDashboard() {
    document.getElementById('user-greeting').innerText = `يا هلا بـ ${appData.profile.name}`;
    const container = document.getElementById('courses-container');
    
    let totalAbs = 0;
    let totalRem = 0;

    container.innerHTML = appData.courses.map((course, idx) => {
        totalAbs += course.absences;
        const remaining = Math.max(0, 4 - course.absences);
        totalRem += remaining;
        
        const progressPerc = (course.absences / 4) * 100;
        let colorClass = 'bg-safe';
        if (course.absences >= 2) colorClass = 'bg-warning';
        if (course.absences >= 4) colorClass = 'bg-danger';

        return `
            <div class="course-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="font-weight: 700;">${course.name}</h4>
                        <p style="font-size: 0.7rem; color: var(--text-muted);">${course.day} | د. ${course.prof}</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-weight: 900; font-size: 1.2rem; color: ${course.absences >= 4 ? 'var(--danger)' : 'inherit'}">${course.absences}</span>
                        <p style="font-size: 0.6rem; opacity: 0.6;">غـيـاب</p>
                    </div>
                </div>
                
                <div class="progress-container">
                    <div class="progress-bar ${colorClass}" style="width: ${Math.min(progressPerc, 100)}%"></div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.7rem; font-weight: 700; color: ${course.absences >= 4 ? 'var(--danger)' : 'var(--text-muted)'}">
                        ${course.absences >= 4 ? "وضعية الحرمان 💀" : `باقي لك ${remaining} فرص`}
                    </span>
                    <button onclick="openAbsenceModal(${idx})" class="btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.7rem;">تسجيل غياب</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('total-absences').innerText = totalAbs;
    document.getElementById('remaining-credit').innerText = totalRem;
    
    updateSmartBanner(totalRem);
}

// تحليل البيانات وتحديث البانر (نشرة المستهترين)
function updateSmartBanner(totalRem) {
    const title = document.getElementById('ai-title');
    const msg = document.getElementById('ai-message');
    const numCourses = appData.courses.length;

    if (totalRem === 0) {
        title.innerText = "انتهت الحلول.. 💀";
        msg.innerText = "رصيدك صفر. لو غبت محاضرة ثانية، الدكتور بيحذفك من الكوكب مش بس الكشف.";
    } else if (totalRem >= numCourses) {
        title.innerText = "وضع الهروب الكبير! 🏃‍♂️";
        msg.innerText = "رصيدك ممتاز. تقدر تغيب الأسبوع القادم كاملاً وتعتكف في الكافيه، ربي ستر عليك.";
    } else {
        title.innerText = "خلك ذكي.. ⚖️";
        msg.innerText = `ما تقدر تغيب الأسبوع كامل، لكن تقدر "تزلب" ${totalRem} محاضرات بس. اختر ضحاياك بعناية!`;
    }
}

// --- 6. منطق تسجيل الغياب (Absence Modal) ---
let activeCourseIdx = null;

function openAbsenceModal(idx) {
    activeCourseIdx = idx;
    document.getElementById('absence-modal').classList.remove('hidden');
    document.getElementById('reason-selection').classList.add('hidden');
}

document.getElementById('btn-no-attendance').addEventListener('click', () => {
    alert("رزقك جاك! ما دام ما حضّر الدكتور، كأنك حضرت وزيادة. روح اشرب شاي عدني.");
    closeModal();
});

document.getElementById('btn-took-attendance').addEventListener('click', () => {
    document.getElementById('reason-selection').classList.remove('hidden');
});

document.getElementById('confirm-absence').addEventListener('click', () => {
    const reason = document.getElementById('absence-reason').value;
    const course = appData.courses[activeCourseIdx];
    
    course.absences += 1;
    course.reasons.push(reason);
    
    saveData();
    renderDashboard();
    closeModal();

    if (course.absences === 4) {
        alert("⚠️ رسمياً: وصلت للخط الأحمر في هذه المادة. المرة الجاية بتشوف الدكتور في الأحلام بس.");
    }
});

function closeModal() {
    document.getElementById('absence-modal').classList.add('hidden');
}

// --- 7. وظائف عامة (إعادة ضبط وحفظ) ---
function saveData() {
    localStorage.setItem('gyabi_data', JSON.stringify(appData));
}

function confirmReset() {
    if (confirm("هل أنت متأكد؟ سيتم تصفير كل شيء لبدء فصل دراسي جديد. لا يمكن التراجع!")) {
        localStorage.removeItem('gyabi_data');
        location.reload();
    }
}

document.getElementById('reset-session').addEventListener('click', confirmReset);
