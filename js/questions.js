// js/questions.js

/**
 * =================================================================
 * وحدة توليد الأسئلة (Questions Module)
 * =================================================================
 * هذا الملف يحتوي على كل دوال توليد الأسئلة المختلفة.
 * كل دالة مسؤولة عن إنشاء نوع واحد من الأسئلة.
 *
 * --- العقد الموحد لكل دالة سؤال ---
 * كل دالة يجب أن تعيد كائنًا (object) يحتوي على:
 * 1. questionHTML: سلسلة نصية (string) تحتوي على كود HTML الخاص بالسؤال.
 * 2. correctAnswer: سلسلة نصية (string) تحتوي على الإجابة الصحيحة لعرضها للمستخدم.
 * 3. setupListeners: دالة (function) تأخذ عنصر 'questionArea' كمعامل،
 *    وتقوم بإضافة مستمعي الأحداث (event listeners) اللازمين لهذا السؤال.
 * =================================================================
 */

// --- دالة مساعدة (يمكن استخدامها في كل دوال الأسئلة) ---
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

// =================================================================
// --- قسم دوال توليد الأسئلة ---
// =================================================================

/**
 * سؤال: اختر الآية التالية.
 */
function generateChooseNextQuestion(pageAyahs, qari, handleResultCallback) {
    // التحقق من وجود آيات كافية لهذا النوع من الأسئلة
    if (pageAyahs.length < 2) return null;

    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1));
    const questionAyah = pageAyahs[startIndex];
    const correctNextAyah = pageAyahs[startIndex + 1];
    
    // اختيار خيارات خاطئة عشوائية
    const wrongOptions = shuffleArray(pageAyahs.filter(a => a.number !== correctNextAyah.number && a.number !== questionAyah.number)).slice(0, 2);
    const options = shuffleArray([correctNextAyah, ...wrongOptions]);
    
    // 1. بناء كود HTML للسؤال
    const questionHTML = `
        <h3>السؤال: استمع واختر الآية التالية</h3>
        <audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>
        ${options.map(opt => `<div class="option-div" data-number="${opt.number}">${opt.text}</div>` ).join('')}
    `;

    // 2. تحديد الإجابة الصحيحة كنص
    const correctAnswer = correctNextAyah.text;

    // 3. إنشاء دالة لإضافة مستمعي الأحداث
    const setupListeners = (questionArea) => {
        questionArea.querySelectorAll('.option-div').forEach(el => {
            el.addEventListener('click', () => {
                const isCorrect = el.dataset.number == correctNextAyah.number;
                // استدعاء الدالة التي تم تمريرها من quiz.js للتعامل مع النتيجة
                handleResultCallback(isCorrect, correctAnswer, el);
            });
        });
    };

    return { questionHTML, correctAnswer, setupListeners };
}

/**
 * سؤال: حدد موقع الآية في الصفحة.
 */
function generateLocateAyahQuestion(pageAyahs, qari, handleResultCallback) {
    const ayahIndex = Math.floor(Math.random() * pageAyahs.length);
    const questionAyah = pageAyahs[ayahIndex];
    const totalAyahs = pageAyahs.length;
    
    let correctLocation;
    if (ayahIndex < totalAyahs / 3) correctLocation = 'بداية';
    else if (ayahIndex < (totalAyahs * 2) / 3) correctLocation = 'وسط';
    else correctLocation = 'نهاية';

    const questionHTML = `
        <h3>السؤال: أين يقع موضع هذه الآية في الصفحة؟</h3>
        <audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>
        <div class="interactive-area">
            ${['بداية', 'وسط', 'نهاية'].map(loc => `<div class="choice-box" data-location="${loc}">${loc} الصفحة</div>` ).join('')}
        </div>
    `;
    
    const correctAnswer = `${correctLocation} الصفحة`;

    const setupListeners = (questionArea) => {
        questionArea.querySelectorAll('.choice-box').forEach(el => {
            el.addEventListener('click', () => {
                const isCorrect = el.dataset.location === correctLocation;
                handleResultCallback(isCorrect, correctAnswer, el);
            });
        });
    };

    return { questionHTML, correctAnswer, setupListeners };
}

//
// >>> أضف بقية دوال الأسئلة الـ 11 هنا بنفس الطريقة <<<
//

// =================================================================
// --- تجميع وتصدير كل دوال الأسئلة ---
// =================================================================

// عندما تضيف دالة سؤال جديدة في الأعلى، فقط أضف اسمها إلى هذه المصفوفة.
export const allQuestionGenerators = [
    generateChooseNextQuestion,
    generateLocateAyahQuestion,
    // generateAudioSortQuestion, // مثال: هكذا ستضيف سؤالاً جديداً
    // generateAudioIntruderQuestion,
];
