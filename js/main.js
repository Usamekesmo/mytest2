// js/main.js

/**
 * =================================================================
 * الملف الرئيسي للتطبيق (Main Entry Point)
 * =================================================================
 * هذا هو الملف الذي يتم تشغيله أولاً. وظيفته هي تهيئة التطبيق
 * وربط الأحداث الرئيسية (مثل نقرات الأزرار) بالوحدات المنطقية
 * المناسبة (مثل quiz.js و api.js).
 * =================================================================
 */

// استيراد الوحدات التي سيستخدمها
import * as ui from './ui.js';
import { fetchPageData } from './api.js';
import * as quiz from './quiz.js';

// --- 1. دالة التهيئة الرئيسية ---

/**
 * تقوم بتهيئة التطبيق عند تحميل الصفحة.
 */
function initialize() {
    console.log("التطبيق جاهز للبدء!");
    
    // عرض شاشة البداية عند فتح التطبيق لأول مرة
    ui.showScreen(ui.startScreen);

    // ربط حدث النقر على زر "ابدأ الاختبار" بالدالة الخاصة به
    ui.startButton.addEventListener('click', onStartButtonClick);
    
    // ربط زر "إجراء اختبار جديد" في شاشة النتائج بإعادة تحميل الصفحة
    const reloadButton = document.querySelector('#result-screen button');
    if (reloadButton) {
        reloadButton.addEventListener('click', () => location.reload());
    }
}

// --- 2. معالجات الأحداث (Event Handlers) ---

/**
 * يتم تشغيل هذه الدالة عند النقر على زر "ابدأ الاختبار".
 */
async function onStartButtonClick() {
    // أ. جمع البيانات من حقول الإدخال في واجهة المستخدم
    const userName = ui.userNameInput.value;
    const pageNumber = ui.pageNumberInput.value;
    const questionsCount = parseInt(ui.questionsCountSelect.value);
    const selectedQari = ui.qariSelect.value;

    // ب. التحقق من صحة البيانات المدخلة
    if (!userName || !pageNumber || pageNumber < 1 || pageNumber > 604) {
        alert('الرجاء إدخال اسمك ورقم صفحة صحيح (بين 1 و 604).');
        return; // إيقاف التنفيذ إذا كانت البيانات غير صالحة
    }

    // ج. إظهار أيقونة التحميل لإعلام المستخدم بأن شيئًا ما يحدث
    ui.toggleLoader(true);

    // د. جلب بيانات الصفحة المطلوبة من الخادم
    const ayahs = await fetchPageData(pageNumber);

    // هـ. إخفاء أيقونة التحميل بعد عودة البيانات
    ui.toggleLoader(false);

    // و. التحقق من أن البيانات قد تم جلبها بنجاح
    if (ayahs) {
        // إذا نجح الجلب، ابدأ الاختبار مع تمرير كل الإعدادات
        quiz.start({
            pageAyahs: ayahs,
            totalQuestions: questionsCount,
            selectedQari: selectedQari,
            userName: userName,
            pageNumber: pageNumber
        });
    }
    // إذا فشل الجلب، ستكون دالة fetchPageData قد عرضت رسالة خطأ بالفعل.
}

// --- 3. تشغيل التطبيق ---
// استدعاء دالة التهيئة لبدء كل شيء.
initialize();
