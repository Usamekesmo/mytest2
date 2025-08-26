// js/ui.js

/**
 * =================================================================
 * وحدة واجهة المستخدم (User Interface Module)
 * =================================================================
 * هذا الملف يحتوي على كل ما يتعلق بالتعامل مع عناصر الصفحة (DOM).
 * وظيفته هي تصدير (export) عناصر الصفحة والدوال التي تتحكم
 * في مظهرها، مثل إظهار الشاشات أو تحديث النصوص.
 * =================================================================
 */

// --- 1. استهداف عناصر الصفحة (DOM Elements) ---
// نقوم بتصدير كل عنصر حتى نتمكن من ربط الأحداث به في main.js
export const startScreen = document.getElementById('start-screen');
export const quizScreen = document.getElementById('quiz-screen');
export const errorReviewScreen = document.getElementById('error-review-screen');
export const resultScreen = document.getElementById('result-screen');

export const loader = document.getElementById('loader');
export const startButton = document.getElementById('startButton');

export const userNameInput = document.getElementById('userName');
export const pageNumberInput = document.getElementById('pageNumber');
export const qariSelect = document.getElementById('qariSelect');
export const questionsCountSelect = document.getElementById('questionsCount');

export const progressCounter = document.getElementById('progress-counter');
export const progressBar = document.getElementById('progress-bar');
export const questionArea = document.getElementById('question-area');
export const feedbackArea = document.getElementById('feedback-area');

export const errorList = document.getElementById('error-list');
export const showFinalResultButton = document.getElementById('show-final-result-button');

const resultNameEl = document.getElementById('resultName');
const finalScoreEl = document.getElementById('finalScore');
const newBestScoreEl = document.getElementById('new-best-score-message');


// --- 2. دوال التحكم بالواجهة (UI Control Functions) ---

/**
 * يخفي كل الشاشات الرئيسية ثم يظهر الشاشة المطلوبة.
 * @param {HTMLElement} screenToShow - العنصر الخاص بالشاشة التي نريد إظهارها.
 */
export function showScreen(screenToShow) {
    [startScreen, quizScreen, errorReviewScreen, resultScreen].forEach(screen => {
        screen.classList.add('hidden');
    });
    screenToShow.classList.remove('hidden');
}

/**
 * يظهر أو يخفي أيقونة التحميل ويعطل/يفعل زر البدء.
 * @param {boolean} show - إذا كانت true، يظهر المحمل، وإلا يخفيه.
 */
export function toggleLoader(show) {
    loader.classList.toggle('hidden', !show);
    startButton.disabled = show;
}

/**
 * يحدّث شريط وعداد التقدم في الاختبار.
 * @param {number} current - رقم السؤال الحالي.
 * @param {number} total - إجمالي عدد الأسئلة.
 */
export function updateProgress(current, total) {
    progressCounter.textContent = `السؤال ${current} من ${total}`;
    // يتم حساب النسبة بناءً على الأسئلة المكتملة
    const percentage = total > 0 ? ((current - 1) / total) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
}

/**
 * يعرض رسالة التقييم (صحيح/خطأ) بعد إجابة المستخدم.
 * @param {boolean} isCorrect - هل الإجابة صحيحة؟
 * @param {string} correctAnswerText - النص الذي سيظهر في حالة الإجابة الخاطئة.
 */
export function showFeedback(isCorrect, correctAnswerText = '') {
    feedbackArea.classList.remove('hidden');
    if (isCorrect) {
        feedbackArea.textContent = 'إجابة صحيحة! أحسنت.';
        feedbackArea.className = 'correct-feedback';
    } else {
        // تم تعديل الرسالة لتكون أوضح
        feedbackArea.textContent = `إجابة خاطئة. الصحيح هو: ${correctAnswerText}`;
        feedbackArea.className = 'wrong-feedback';
    }
}

/**
 * يعرض شاشة مراجعة الأخطاء مع قائمة الأسئلة الخاطئة.
 * @param {Array} errors - مصفوفة تحتوي على كائنات الأخطاء.
 */
export function displayErrorReview(errors) {
    showScreen(errorReviewScreen);
    errorList.innerHTML = ''; // تفريغ القائمة القديمة
    errors.forEach(error => {
        const item = document.createElement('div');
        item.className = 'error-review-item';
        item.innerHTML = `
            <h4>سؤال خاطئ</h4>
            <div>${error.questionHTML.replace(/<button.*<\/button>/g, '')}</div>
            <p>الإجابة الصحيحة: <span class="correct-text">${error.correctAnswer}</span></p>
        `;
        // تمييز الإجابات الصحيحة والخاطئة (إذا كانت محددة)
        item.querySelectorAll('.choice-box, .option-div, .number-box').forEach(el => {
            el.style.pointerEvents = 'none';
            if (el.dataset.correct !== 'true') {
                el.style.opacity = '0.5';
            } else {
                el.classList.add('correct-answer');
            }
        });
        errorList.appendChild(item);
    });
}

/**
 * يعرض شاشة النتيجة النهائية.
 * @param {object} resultInfo - كائن يحتوي على معلومات النتيجة (userName, score, totalQuestions).
 */
export function displayFinalResult(resultInfo) {
    showScreen(resultScreen);
    resultNameEl.textContent = resultInfo.userName;
    finalScoreEl.textContent = `${resultInfo.score} من ${resultInfo.totalQuestions}`;
    newBestScoreEl.textContent = 'جاري حفظ نتيجتك على السحابة...';
    newBestScoreEl.style.color = '#004d40'; // إعادة اللون الافتراضي
}

/**
 * يحدّث رسالة حفظ النتيجة بعد استجابة الخادم.
 * @param {boolean} success - هل تمت عملية الحفظ بنجاح؟
 */
export function updateSaveMessage(success) {
    if (success) {
        newBestScoreEl.textContent = 'تم حفظ نتيجتك بنجاح على السحابة! 🎉';
    } else {
        newBestScoreEl.textContent = 'حدث خطأ أثناء حفظ النتيجة. تأكد من اتصالك بالإنترنت.';
        newBestScoreEl.style.color = 'red';
    }
}
