// js/quiz.js

/**
 * =================================================================
 * وحدة إدارة الاختبار (Quiz Logic Module)
 * =================================================================
 * هذا الملف هو "العقل" الذي يدير سير الاختبار. هو المسؤول عن:
 * - بدء الاختبار وإعداده.
 * - تتبع حالة الاختبار (النتيجة، السؤال الحالي).
 * - اختيار سؤال عشوائي وعرضه.
 * - التعامل مع إجابة المستخدم وتحديث النتيجة.
 * - إنهاء الاختبار وحفظ النتيجة.
 * =================================================================
 */

// استيراد الوحدات التي سيستخدمها
import * as ui from './ui.js';
import { saveResultToSheet } from './api.js';
import { allQuestionGenerators } from './questions.js';

// --- 1. حالة الاختبار (State) ---
// هذا الكائن يحتفظ بكل المعلومات الحالية للاختبار.
let state = {
    pageAyahs: [],
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 10,
    selectedQari: 'ar.alafasy',
    errorLog: [],
    userName: '',
    pageNumber: 0
};

// دالة مساعدة لخلط الأسئلة
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

// --- 2. دوال التحكم بسير الاختبار ---

/**
 * يبدأ اختبارًا جديدًا. يستقبل كائن الإعدادات من main.js.
 * @param {object} settings - كائن يحتوي على إعدادات الاختبار.
 */
export function start(settings) {
    // إعادة تعيين حالة الاختبار مع الإعدادات الجديدة
    state = {
        ...state, // يحتفظ بالقيم الافتراضية
        ...settings, // يكتب فوقها بالإعدادات الجديدة
        score: 0,
        currentQuestionIndex: 0,
        errorLog: []
    };
    
    ui.showScreen(ui.quizScreen);
    displayNextQuestion();
}

/**
 * يعرض السؤال التالي أو ينهي الاختبار إذا اكتملت الأسئلة.
 */
function displayNextQuestion() {
    // التحقق مما إذا كان الاختبار قد انتهى
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }

    state.currentQuestionIndex++;
    ui.updateProgress(state.currentQuestionIndex, state.totalQuestions);
    ui.feedbackArea.classList.add('hidden'); // إخفاء رسالة التقييم السابقة

    // اختيار دالة سؤال عشوائية من مصفوفة الأسئلة
    const randomGenerator = shuffleArray(allQuestionGenerators)[0];
    
    // توليد السؤال باستخدام الدالة العشوائية
    // نمرر لها دالة handleResult كـ "رد اتصال" (callback)
    const question = randomGenerator(state.pageAyahs, state.selectedQari, handleResult);

    if (question) {
        // إذا تم إنشاء السؤال بنجاح
        ui.questionArea.innerHTML = question.questionHTML;
        // استدعاء دالة setupListeners الخاصة بالسؤال لإضافة الأحداث
        question.setupListeners(ui.questionArea);
    } else {
        // إذا فشلت الدالة في إنشاء سؤال (مثلاً، لعدم وجود آيات كافية)
        console.warn(`فشل مولد الأسئلة ${randomGenerator.name} في إنشاء سؤال. يتم المحاولة مرة أخرى.`);
        // حاول عرض سؤال آخر بدلاً من التوقف
        displayNextQuestion();
    }
}

/**
 * يتعامل مع إجابة المستخدم. يتم استدعاؤها من داخل setupListeners في questions.js.
 * @param {boolean} isCorrect - هل الإجابة صحيحة؟
 * @param {string} correctAnswerText - نص الإجابة الصحيحة.
 * @param {HTMLElement} clickedElement - العنصر الذي تم النقر عليه.
 */
function handleResult(isCorrect, correctAnswerText, clickedElement) {
    // منع المستخدم من النقر مرة أخرى على الخيارات
    ui.questionArea.querySelectorAll('.choice-box, .option-div, .number-box').forEach(el => {
        el.style.pointerEvents = 'none';
    });

    if (isCorrect) {
        state.score++;
        clickedElement.classList.add('correct-answer');
    } else {
        // تسجيل السؤال الخاطئ لمراجعته لاحقًا
        state.errorLog.push({
            questionHTML: ui.questionArea.innerHTML,
            correctAnswer: correctAnswerText
        });
        clickedElement.classList.add('wrong-answer');
        // إظهار الإجابة الصحيحة للمستخدم
        const correctEl = ui.questionArea.querySelector(`[data-correct="true"]`) || 
                          ui.questionArea.querySelector(`[data-number="${correctAnswerText}"]`) ||
                          ui.questionArea.querySelector(`[data-location="${correctAnswerText.split(' ')[0]}"]`);
        if (correctEl) {
            correctEl.classList.add('correct-answer');
        }
    }

    // عرض رسالة التقييم (صحيح/خطأ)
    ui.showFeedback(isCorrect, correctAnswerText);
    
    // الانتظار لبضع ثوان ثم عرض السؤال التالي
    setTimeout(displayNextQuestion, 3000);
}

/**
 * ينهي الاختبار ويعرض النتائج.
 */
async function endQuiz() {
    // التأكد من أن شريط التقدم مكتمل 100%
    ui.updateProgress(state.totalQuestions, state.totalQuestions);
    progressBar.style.width = '100%';

    if (state.errorLog.length > 0) {
        // إذا كانت هناك أخطاء، اعرض شاشة المراجعة أولاً
        ui.displayErrorReview(state.errorLog);
    } else {
        // إذا لم تكن هناك أخطاء، اعرض النتيجة النهائية مباشرة
        ui.displayFinalResult(state);
        // ... ثم احفظها في Google Sheets
        const success = await saveResultToSheet(state);
        ui.updateSaveMessage(success);
    }
}

// --- 3. ربط الأحداث الداخلية ---

// ربط الزر الموجود في شاشة مراجعة الأخطاء لعرض النتيجة النهائية
ui.showFinalResultButton.addEventListener('click', async () => {
    ui.displayFinalResult(state);
    const success = await saveResultToSheet(state);
    ui.updateSaveMessage(success);
});
