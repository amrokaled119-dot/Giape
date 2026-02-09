// --- 1. إدارة البيانات والتهيئة ---
let appData = JSON.parse(localStorage.getItem('hu_tracker')) || {
    profile: null,
    courses: []
};

// تشغيل التطبيق عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    if (appData.profile) {
        showDashboard();
    } else {
        navigateTo('onboarding');
    }
});

// وظيفة التنقل بين الشاشات
function navigateTo(screenId) {
    document.querySelectorAll('.container, #onboarding, #scheduleSetup, #dashboard, #statsScreen')
        .forEach(s => s.classList.add('hidden'));
    
    const target = document.getElementById(screenId);
    target.classList.remove('hidden');
    target.classList.add('screen-fade-in');
}

// --- 2. إعداد الملف الشخصي والجدول ---
function saveProfile() {
    const name = document.getElementById('userName').value.trim();
    if (!name) return alert("يا دكتور، سجل اسمك أولاً!");

    appData.profile = {
        name: name,
        dept: document.getElementById('userDept').value,
        level: document.getElementById('userLevel').value
    };
    
    renderScheduleInputs();
    navigateTo('scheduleSetup');
}

function renderScheduleInputs() {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    const container = document.getElementById('daysContainer');
    container.innerHTML = days.map(day => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
            <h3 class="font-bold text-blue-700 mb-3 border-r-4 border-blue-600 pr-2">${day}</h3>
            ${[1, 2].map(i => `
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <input type="text" placeholder="اسم المادة" class="c-name p-2 border rounded-lg text-sm focus:ring-1 focus:ring-blue-400 outline-none">
                    <input type="text" placeholder="اسم الدكتور" class="p-name p-2 border rounded-lg text-sm focus:ring-1 focus:ring-blue-400 outline-none">
                </div>
            `).join('')}
        </div>
    `).join('');
}

function saveSchedule() {
    const names = document.querySelectorAll('.c-name');
    const profs = document.querySelectorAll('.p-name');
    
    appData.courses = []; // إعادة تعيين لضمان عدم التكرار
    
    names.forEach((input, i) => {
        if (input.value.trim() !== "") {
            appData.courses.push({
                id: Date.now() + i,
                name: input.value.trim(),
                prof: profs[i].value.trim() || "دكتور مجهول",
                absences: 0,
                reasons: []
            });
        }
    });

    if (appData.courses.length === 0) return alert("سجل مادة واحدة على الأقل.. بلاش تسليت من الآن!");

    saveAndRefresh();
    showDashboard();
}

// --- 3. لوحة التحكم (Dashboard) ---
function showDashboard() {
    navigateTo('dashboard');
    document.getElementById('greeting').innerHTML = `يا هلا بـ <span class="text-blue-600">${appData.profile.name}</span>`;
    renderCourseCards();
}

function renderCourseCards() {
    const grid = document.getElementById('coursesGrid');
    grid.innerHTML = appData.courses.map((course, index) => {
        let statusClass = "card-green";
        if (course.absences >= 2) statusClass = "card-yellow";
        if (course.absences >= 4) statusClass = "card-red";

        return `
            <div class="bg-white p-5 rounded-2xl shadow-sm ${statusClass} relative mb-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-gray-800">${course.name}</h3>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">${course.absences}/4</span>
                </div>
                <p class="text-gray-500 text-sm mb-4 italic">د. ${course.prof}</p>
                <div class="flex justify-between items-center">
                    <div class="text-xs font-semibold ${course.absences >= 4 ? 'text-red-600' : 'text-gray-400'}">
                        ${course.absences >= 4 ? 'وضعية الحرمان 💀' : `متبقي لك ${4 - course.absences} غيابات`}
                    </div>
                    <button onclick="openAbsenceModal(${index})" 
                            class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition-all shadow-md">
                        تسجيل غياب
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// --- 4. منطق تسجيل الغياب (Absence Logic) ---
let currentCourseIndex = null;

function openAbsenceModal(index) {
    currentCourseIndex = index;
    const modal = document.getElementById('absenceModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('reasonSection').classList.add('hidden');
}

function askReason(instructorTookAttendance) {
    if (!instructorTookAttendance) {
        alert("رزقك جاك! ما دام ما حضّر الدكتور، كأنك حضرت وزيادة. ارجع لبيتك.");
        closeModal();
    } else {
        document.getElementById('reasonSection').classList.remove('hidden', 'screen-fade-in');
        document.getElementById('reasonSection').classList.add('screen-fade-in');
    }
}

function finalizeAbsence() {
    const reason = document.getElementById('absenceReason').value;
    const course = appData.courses[currentCourseIndex];
    
    course.absences += 1;
    course.reasons.push(reason);
    
    saveAndRefresh();
    closeModal();
    
    if (course.absences === 4) {
        alert("رسمياً: وصلت للخط الأحمر. المرة الجاية بتشوف الدكتور في الأحلام بس.");
    }
}

function closeModal() {
    document.getElementById('absenceModal').classList.add('hidden');
    document.getElementById('absenceModal').classList.remove('flex');
}

// --- 5. الإحصائيات (Statistics) ---
function showStats() {
    navigateTo('statsScreen');
    const total = appData.courses.reduce((sum, c) => sum + c.absences, 0);
    const slackingReasons = ['chilling', 'sleep'];
    
    let slackCount = 0;
    appData.courses.forEach(c => {
        c.reasons.forEach(r => { if(slackingReasons.includes(r)) slackCount++; });
    });

    const slackPercent = total > 0 ? Math.round((slackCount / total) * 100) : 0;
    
    let comment = "بداية جادة.. شكلنا بنشوفك معيد بالكلية.";
    if (slackPercent > 40) comment = "أنت تنافس على لقب زبون الكافيه المثالي.. الجامعة مش لك.";
    if (total > 12) comment = "سجل غياباتك أطول من السيرة الذاتية لعميد الكلية.";

    document.getElementById('statsResult').innerHTML = `
        <div class="p-4 bg-blue-50 rounded-xl mb-4 border border-blue-100">
            <p class="text-sm text-blue-800">إجمالي الغيابات</p>
            <p class="text-3xl font-bold">${total}</p>
        </div>
        <div class="p-4 bg-red-50 rounded-xl border border-red-100">
            <p class="text-sm text-red-800">نسبة "التسليت" الصافي</p>
            <p class="text-3xl font-bold">${slackPercent}%</p>
        </div>
    `;
    document.getElementById('sarcasticComment').innerText = comment;
}

// --- 6. الوظائف المساعدة ---
function saveAndRefresh() {
    localStorage.setItem('hu_tracker', JSON.stringify(appData));
    renderCourseCards();
}
