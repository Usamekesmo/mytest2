// js/quiz.js

import * as ui from './ui.js';
import { saveResult } from './api.js';
import { fetchQuestionsConfig } from './api.js';
import { allQuestionGenerators } from './questions.js';
import * as player from './player.js';
import * as progression from './progression.js';
import { XP_SETTINGS } from './config.js';

// --- حالة الاختبار (State) ---
// هذا الكائن يحتفظ بكل المعلومات المؤقتة الخاصة بالاختبار الحالي فقط.
let state = {
    pageAyahs: [],
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 10,
    selectedQari: 'ar.alafasy',
    errorLog: [],
    userName: '',
    pageNumber: 0,
    xpEarned: 0
};

// مصفوفة لتخزين دوال الأسئلة المفعّلة التي تم جلبها من لوحة التحكم
let activeQuestionFunctions = [];

// دالة مساعدة لخلط الأسئلة
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

/**
 * دالة تهيئة وحدة الاختبار.
 * تقوم بجلب إعدادات الأسئلة من لوحة التحكم وتجهيز قائمة الأسئلة المفعّلة.
 */
export async function initializeQuiz() {
    console.log("جاري تهيئة وحدة الاختبار وجلب إعدادات الأسئلة...");
    const config = await fetchQuestionsConfig();
    
    if (config && config.length > 0) {
        // بناء مصفوفة الدوال المفعّلة بناءً على الإعدادات المجلوبة
        activeQuestionFunctions = config
            .map(q => allQuestionGenerators[q.id])
            .filter(f => typeof f === 'function'); // filter لإزالة أي دوال غير موجودة أو خاطئة
        console.log(`تم تفعيل ${activeQuestionFunctions.length} نوع من الأسئلة.`);
    } else {
        // في حالة الفشل، استخدم كل الأسئلة المتاحة محلياً كخطة بديلة
        console.warn("فشل جلب إعدادات الأسئلة، سيتم استخدام كل الأسئلة المتاحة محلياً.");
        activeQuestionFunctions = Object.values(allQuestionGenerators);
    }

    if (activeQuestionFunctions.length === 0) {
        alert("خطأ فادح: لا توجد أي أسئلة مفعّلة! يرجى مراجعة لوحة التحكم.");
    }
}

/**
 * يبدأ اختبارًا جديدًا بالإعدادات المحددة.
 * @param {object} settings - كائن يحتوي على إعدادات الاختبار.
 */
export function start(settings) {
    // إعادة تعيين حالة الاختبار مع الإعدادات الجديدة
    state = {
        ...state,
        ...settings,
        score: 0,
        currentQuestionIndex: 0,
        errorLog: [],
        xpEarned: 0
    };
    
    ui.showScreen(ui.quizScreen);
    displayNextQuestion();
}

/**
 * يعرض السؤال التالي أو ينهي الاختبار إذا اكتملت الأسئلة.
 */
function displayNextQuestion() {
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }

    state.currentQuestionIndex++;
    ui.updateProgress(state.currentQuestionIndex, state.totalQuestions);
    ui.feedbackArea.classList.add('hidden');

    if (activeQuestionFunctions.length === 0) {
        alert("لا يمكن عرض السؤال لعدم وجود أسئلة مفعّلة.");
        return;
    }
    
    const randomGenerator = shuffleArray(activeQuestionFunctions)[0];
    const question = randomGenerator(state.pageAyahs, state.selectedQari, handleResult);

    if (question) {
        ui.questionArea.innerHTML = question.questionHTML;
        question.setupListeners(ui.questionArea);
    } else {
        console.warn(`فشل مولد الأسئلة ${randomGenerator.name} في إنشاء سؤال. يتم المحاولة مرة أخرى.`);
        displayNextQuestion(); // حاول مرة أخرى بسؤال مختلف
    }
}

/**
 * يتعامل مع إجابة المستخدم. يتم استدعاؤها من داخل دوال الأسئلة.
 * @param {boolean} isCorrect - هل الإجابة صحيحة؟
 * @param {string} correctAnswerText - نص الإجابة الصحيحة.
 * @param {HTMLElement} clickedElement - العنصر الذي تم النقر عليه.
 */
function handleResult(isCorrect, correctAnswerText, clickedElement) {
    ui.disableQuestionInteraction();

    if (isCorrect) {
        state.score++;
        state.xpEarned += XP_SETTINGS.perCorrectAnswer;
        ui.markAnswer(clickedElement, true);
    } else {
        state.errorLog.push({
            questionHTML: ui.questionArea.innerHTML,
            correctAnswer: correctAnswerText
        });
        ui.markAnswer(clickedElement, false);
    }

    ui.showFeedback(isCorrect, correctAnswerText);
    setTimeout(displayNextQuestion, 3000);
}

/**
 * ينهي الاختبار، يحسب النتائج، يحفظ البيانات، ويعرض الشاشة النهائية.
 */
async function endQuiz() {
    ui.updateProgress(state.totalQuestions, state.totalQuestions, true);
    
    // إضافة نقاط إكمال الاختبار
    state.xpEarned += XP_SETTINGS.perQuizCompletion;

    // تحديث بيانات اللاعب المحلية
    const oldXp = player.playerData.xp;
    player.playerData.xp += state.xpEarned;

    // التحقق من وجود ترقية في المستوى
    const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
    if (levelUpInfo) {
        player.playerData.diamonds += levelUpInfo.reward;
    }

    // عرض شاشة مراجعة الأخطاء أولاً إذا وجدت
    if (state.errorLog.length > 0) {
        ui.displayErrorReview(state.errorLog);
    } else {
        // عرض النتيجة النهائية مباشرة
        ui.displayFinalResult(state, levelUpInfo);
    }

    // --- الحفظ في السحابة (يتم في الخلفية) ---
    await player.savePlayer();
    await saveResult(state);
    
    // تحديث رسالة الحفظ في الواجهة بعد اكتمال الحفظ
    ui.updateSaveMessage(true);
}

// ربط الزر في شاشة مراجعة الأخطاء لعرض النتيجة النهائية
ui.showFinalResultButton.addEventListener('click', () => {
    const oldXp = player.playerData.xp - state.xpEarned; // استرجاع القيمة قبل الحساب
    const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
    ui.displayFinalResult(state, levelUpInfo);
});
