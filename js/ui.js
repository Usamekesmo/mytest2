// js/ui.js

// --- 1. استهداف عناصر الصفحة (DOM Elements) ---
export const startScreen = document.getElementById('start-screen');
export const quizScreen = document.getElementById('quiz-screen');
export const errorReviewScreen = document.getElementById('error-review-screen');
export const resultScreen = document.getElementById('result-screen');

export const loader = document.getElementById('loader');
export const startButton = document.getElementById('startButton');
export const reloadButton = document.getElementById('reload-button');

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

// عناصر معلومات اللاعب
const playerInfoDiv = document.getElementById('player-info');
const playerInfoHr = document.getElementById('player-info-hr');
const playerLevelEl = document.getElementById('player-level');
const playerTitleEl = document.getElementById('player-title');
const playerDiamondsEl = document.getElementById('player-diamonds');
const playerXpEl = document.getElementById('player-xp');
const xpBarEl = document.getElementById('xp-bar');

// عناصر شاشة النتائج
const resultNameEl = document.getElementById('resultName');
const finalScoreEl = document.getElementById('finalScore');
const levelUpMessageEl = document.getElementById('level-up-message');
const saveMessageEl = document.getElementById('save-message');


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
 * يعرض معلومات اللاعب المحدثة في شاشة البداية.
 * @param {object} playerData - كائن بيانات اللاعب.
 * @param {object} levelInfo - كائن معلومات المستوى من progression.js.
 */
export function updatePlayerDisplay(playerData, levelInfo) {
    playerLevelEl.textContent = levelInfo.level;
    playerTitleEl.textContent = levelInfo.title;
    playerDiamondsEl.textContent = playerData.diamonds;
    playerXpEl.textContent = `${playerData.xp} / ${levelInfo.nextLevelXp} XP`;
    xpBarEl.style.width = `${levelInfo.progress}%`;
    playerInfoDiv.classList.remove('hidden');
    playerInfoHr.classList.remove('hidden');
}

/**
 * يحدّث شريط وعداد التقدم في الاختبار.
 * @param {number} current - رقم السؤال الحالي.
 * @param {number} total - إجمالي عدد الأسئلة.
 * @param {boolean} finished - هل انتهى الاختبار.
 */
export function updateProgress(current, total, finished = false) {
    progressCounter.textContent = `السؤال ${current} من ${total}`;
    const percentage = finished ? 100 : ((current - 1) / total) * 100;
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
        feedbackArea.textContent = `إجابة خاطئة. الصحيح هو: ${correctAnswerText}`;
        feedbackArea.className = 'wrong-feedback';
    }
}

/**
 * يعطل التفاعل مع خيارات السؤال بعد الإجابة.
 */
export function disableQuestionInteraction() {
    questionArea.querySelectorAll('.choice-box, .option-div, .number-box').forEach(el => {
        el.style.pointerEvents = 'none';
    });
}

/**
 * يلون الإجابة باللون الصحيح أو الخاطئ.
 * @param {HTMLElement} element - العنصر الذي تم النقر عليه.
 * @param {boolean} isCorrect - هل الإجابة صحيحة؟
 */
export function markAnswer(element, isCorrect) {
    element.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
    if (!isCorrect) {
        const correctEl = questionArea.querySelector('[data-correct="true"]');
        if (correctEl) correctEl.classList.add('correct-answer');
    }
}

/**
 * يعرض شاشة مراجعة الأخطاء مع قائمة الأسئلة الخاطئة.
 * @param {Array} errors - مصفوفة تحتوي على كائنات الأخطاء.
 */
export function displayErrorReview(errors) {
    showScreen(errorReviewScreen);
    errorList.innerHTML = '';
    errors.forEach(error => {
        const item = document.createElement('div');
        item.className = 'error-review-item';
        item.innerHTML = `
            <h4>سؤال خاطئ</h4>
            <div>${error.questionHTML.replace(/<button.*<\/button>/g, '')}</div>
            <p>الإجابة الصحيحة: <span class="correct-text">${error.correctAnswer}</span></p>
        `;
        errorList.appendChild(item);
    });
}

/**
 * يعرض شاشة النتيجة النهائية.
 * @param {object} resultState - كائن حالة الاختبار.
 * @param {object|null} levelUpInfo - معلومات الترقية إذا حدثت.
 */
export function displayFinalResult(resultState, levelUpInfo) {
    showScreen(resultScreen);
    resultNameEl.textContent = resultState.userName;
    finalScoreEl.textContent = `${resultState.score} من ${resultState.totalQuestions}`;
    
    if (levelUpInfo) {
        levelUpMessageEl.innerHTML = `🎉 <strong>ترقية!</strong> لقد وصلت إلى المستوى ${levelUpInfo.level} (${levelUpInfo.title}) وحصلت على ${levelUpInfo.reward} ألماسة!`;
        levelUpMessageEl.classList.remove('hidden');
    } else {
        levelUpMessageEl.classList.add('hidden');
    }
    
    saveMessageEl.textContent = 'جاري حفظ تقدمك على السحابة...';
}

/**
 * يحدّث رسالة حفظ النتيجة بعد استجابة الخادم.
 * @param {boolean} success - هل تمت عملية الحفظ بنجاح؟
 */
export function updateSaveMessage(success) {
    if (success) {
        saveMessageEl.textContent = 'تم حفظ تقدمك بنجاح على السحابة!';
    } else {
        saveMessageEl.textContent = 'حدث خطأ أثناء حفظ التقدم. قد لا يتم تسجيل نتيجتك.';
        saveMessageEl.style.color = 'red';
    }
}
