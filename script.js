// --- 1. إدارة البيانات والتهيئة ---
let appData = JSON.parse(localStorage.getItem('gyabi_v2_data')) || null;
let activeCourseIdx = null;

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    if (appData) {
        showScreen('dashboard-view');
        renderDashboard();
        document.getElementById('reset-session').classList.remove('hidden');
    } else {
        showScreen('onboarding-view');
    }
});

// دالة التنقل بين الشاشات
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    window.scrollTo(0, 0);
}

// --- 2. نظام الوضع الليلي ---
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

// --- 3. تسجيل الدخول لأول مرة (Onboarding) ---
document.getElementById('start-app').addEventListener('click', () => {
    const name = document.getElementById('input-user-name').value.trim();
    if (!name) return alert("سجل اسمك يا دكتور أولاً!");

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

// --- 4. إعداد وتعديل الجدول الدراسي ---
function renderScheduleInputs() {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    const container = document.getElementById('days-inputs-container');
    
    container.innerHTML = days.map(day => {
        const existing = appData.courses.filter(c => c.day === day);
        return `
            <div class="day-group" style="margin-bottom: 2rem;">
                <h4 style="color: var(--primary-blue); margin-bottom: 0.8rem;">📅 يوم ${day}</h4>
                ${[0, 1].map(i => `
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.6rem;">
                        <input type="text" class="c-name-in" data-day="${day}" placeholder="اسم المادة" value="${existing[i]?.name || ''}">
                        <input type="text" class="p-name-in" placeholder="الدكتور" value="${existing[i]?.prof || ''}">
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

document.getElementById('save-schedule').addEventListener('click', () => {
    const names = document.querySelectorAll('.c-name-in');
    const profs = document.querySelectorAll('.p-name-in');
    const newCourses = [];

    names.forEach((el, i) => {
        const name = el.value.trim();
        const prof = profs[i].value.trim();
        if (name) {
            // التحقق إذا كانت المادة موجودة مسبقاً للحفاظ على غياباتها عند التعديل
            const oldCourse = appData.courses.find(c => c.name === name);
            newCourses.push({
                name,
                prof: prof || "دكتور غير محدد",
                day: el.dataset.day,
                absences: oldCourse ? oldCourse.absences : 0,
                reasons: oldCourse ? oldCourse.reasons : []
            });
        }
    });

    if (newCourses.length === 0) return alert("أدخل مادة واحدة على الأقل!");
    
    appData.courses = newCourses;
    saveAndRefresh();
    showScreen('dashboard-view');
    document.getElementById('reset-session').classList.remove('hidden');
});

document.getElementById('edit-schedule-btn').addEventListener('click', () => {
    renderScheduleInputs();
    showScreen('setup-view');
});

// --- 5. لوحة التحكم (Dashboard) ---
function renderDashboard() {
    document.getElementById('user-greeting').innerText = `يا هلا بـ ${appData.profile.name}`;
    document.getElementById('user-subtext').innerText = `${appData.profile.dept} - مستوى ${appData.profile.level}`;
    
    const container = document.getElementById('courses-container');
    document.getElementById('quick-stats').classList.remove('hidden');

    let totalAbs = 0;
    container.innerHTML = appData.courses.map((course, idx) => {
        totalAbs += course.absences;
        const progress = (course.absences / 4) * 100;
        let barColor = 'bg-safe';
        if (course.absences >= 2) barColor = 'bg-warn';
        if (course.absences >= 4) barColor = 'bg-danger';

        return `
            <div class="course-card">
                <div class="section-header" style="margin-bottom: 0.5rem;">
                    <div>
                        <h4 style="font-weight: 700; font-size: 1.1rem;">${course.name}</h4>
                        <p class="text-muted" style="font-size: 0.75rem;">${course.day} • د. ${course.prof}</p>
                    </div>
                    <div style="text-align: left;">
                        <span style="font-size: 1.5rem; font-weight: 900; ${course.absences >= 4 ? 'color: var(--color-danger)' : ''}">${course.absences}</span>
                        <span class="text-muted" style="font-size: 0.7rem; display: block;">/ 4 غيابات</span>
                    </div>
                </div>
                
                <div class="progress-container">
                    <div class="progress-bar ${barColor}" style="width: ${Math.min(progress, 100)}%"></div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: ${course.absences >= 4 ? 'var(--color-danger)' : 'var(--text-secondary)'}">
                        ${course.absences >= 4 ? "حرمان 💀" : `متبقي: ${4 - course.absences}`}
                    </span>
                    <button onclick="openAbsenceModal(${idx}, '${course.name}')" class="btn-primary" style="width: auto; padding: 0.6rem 1.2rem; font-size: 0.8rem;">تسجيل غياب</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('total-absences').innerText = totalAbs;
    const totalPossible = appData.courses.length * 4;
    document.getElementById('remaining-credit').innerText = Math.max(0, totalPossible - totalAbs);
}

// --- 6. نظام تسجيل الغياب (Modal Logic) ---
function openAbsenceModal(idx, name) {
    activeCourseIdx = idx;
    document.getElementById('modal-course-name').innerText = name;
    document.getElementById('absence-modal').classList.remove('hidden');
    document.getElementById('reason-selection').classList.add('hidden');
    document.getElementById('attendance-check').classList.remove('hidden');
}

document.getElementById('btn-no-attendance').addEventListener('click', () => {
    alert("الحمد لله! ما دام الدكتور ما حضّر، وضعك في السليم. استمتع بيومك.");
    closeAbsenceModal();
});

document.getElementById('btn-took-attendance').addEventListener('click', () => {
    document.getElementById('attendance-check').classList.add('hidden');
    document.getElementById('reason-selection').classList.remove('hidden');
});

document.getElementById('confirm-absence').addEventListener('click', () => {
    const reason = document.getElementById('absence-reason').value;
    appData.courses[activeCourseIdx].absences += 1;
    appData.courses[activeCourseIdx].reasons.push({
        date: new Date().toLocaleDateString('ar-YE'),
        reason: reason
    });

    saveAndRefresh();
    closeAbsenceModal();

    if (appData.courses[activeCourseIdx].absences === 4) {
        alert("⚠️ تنبيه: وصلت للحد الأقصى للغياب في هذه المادة (حرمان).");
    }
});

function closeAbsenceModal() {
    document.getElementById('absence-modal').classList.add('hidden');
}

document.getElementById('close-modal').addEventListener('click', closeAbsenceModal);

// --- 7. الوظائف المساعدة (إعادة الضبط والحفظ) ---
function saveAndRefresh() {
    localStorage.setItem('gyabi_v2_data', JSON.stringify(appData));
    renderDashboard();
}

function confirmReset() {
    const check = confirm("هل أنت متأكد؟ سيتم حذف جميع الغيابات والجدول لبدء فصل دراسي جديد. هذا الإجراء لا يمكن التراجع عنه!");
    if (check) {
        localStorage.removeItem('gyabi_v2_data');
        location.reload();
    }
}

document.getElementById('reset-session').addEventListener('click', confirmReset);
