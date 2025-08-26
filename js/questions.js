// js/questions.js

/**
 * =================================================================
 * وحدة توليد الأسئلة (Questions Module)
 * =================================================================
 * هذا الملف يحتوي على كل دوال توليد الأسئلة المختلفة.
 * كل دالة مسؤولة عن إنشاء نوع واحد من الأسئلة.
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
    if (pageAyahs.length < 2) return null;

    const startIndex = Math.floor(Math.random() * (pageAyahs.length - 1));
    const questionAyah = pageAyahs[startIndex];
    const correctNextAyah = pageAyahs[startIndex + 1];
    
    const wrongOptions = shuffleArray(pageAyahs.filter(a => a.number !== correctNextAyah.number && a.number !== questionAyah.number)).slice(0, 2);
    const options = shuffleArray([correctNextAyah, ...wrongOptions]);
    
    const questionHTML = `
        <h3>السؤال: استمع واختر الآية التالية</h3>
        <audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>
        ${options.map(opt => `<div class="option-div" data-number="${opt.number}">${opt.text}</div>` ).join('')}
    `;

    const correctAnswer = correctNextAyah.text;

    const setupListeners = (questionArea) => {
        questionArea.querySelectorAll('.option-div').forEach(el => {
            el.addEventListener('click', () => {
                const isCorrect = el.dataset.number == correctNextAyah.number;
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

/**
 * سؤال: أكمل الكلمة الأخيرة من الآية.
 */
function generateCompleteLastWordQuestion(pageAyahs, qari, handleResultCallback) {
    const suitableAyahs = pageAyahs.filter(a => a.text.split(' ').length > 3);
    if (suitableAyahs.length < 4) return null;

    const questionAyah = shuffleArray(suitableAyahs)[0];
    const words = questionAyah.text.split(' ');
    const correctLastWord = words.pop();
    const incompleteAyahText = words.join(' ');
    
    const wrongOptions = shuffleArray(suitableAyahs.filter(a => a.number !== questionAyah.number))
        .slice(0, 3)
        .map(a => a.text.split(' ').pop());
        
    const options = shuffleArray([correctLastWord, ...wrongOptions]);

    const questionHTML = `
        <h3>السؤال: اختر الكلمة الصحيحة لإكمال الآية التالية:</h3>
        <p style="font-family: 'Amiri', serif; font-size: 22px;">${incompleteAyahText} (...)</p>
        <audio controls autoplay src="https://cdn.islamic.network/quran/audio/128/${qari}/${questionAyah.number}.mp3"></audio>
        <div class="interactive-area">
            ${options.map(opt => `<div class="choice-box" data-word="${opt}">${opt}</div>` ).join('')}
        </div>
    `;

    const correctAnswer = correctLastWord;

    const setupListeners = (questionArea) => {
        questionArea.querySelectorAll('.choice-box').forEach(el => {
            el.addEventListener('click', () => {
                const isCorrect = el.dataset.word === correctLastWord;
                handleResultCallback(isCorrect, correctAnswer, el);
            });
        });
    };

    return { questionHTML, correctAnswer, setupListeners };
}


// =================================================================
// --- تجميع وتصدير كل دوال الأسئلة ---
// =================================================================

/**
 * هذا الكائن هو "كتالوج" لكل دوال الأسئلة المتاحة في التطبيق.
 * المفتاح (key) يجب أن يطابق 'questionId' في ورقة التحكم Google Sheet.
 * القيمة (value) هي الدالة نفسها.
 */
export const allQuestionGenerators = {
    generateChooseNextQuestion,
    generateLocateAyahQuestion,
    generateCompleteLastWordQuestion,
    // لإضافة سؤال جديد، اكتب دالته في الأعلى ثم أضف اسمه هنا
    // generateAudioSortQuestion,
};
