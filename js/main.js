// js/main.js

import * as ui from './ui.js';
import { fetchPageData } from './api.js';
import * as quiz from './quiz.js';
import * as player from './player.js';
import * as progression from './progression.js';

/**
 * =================================================================
 * الملف الرئيسي للتطبيق (Main Entry Point)
 * =================================================================
 * هذا هو الملف الذي يتم تشغيله أولاً. وظيفته هي تهيئة التطبيق
 * وربط الأحداث الرئيسية بالوحدات المنطقية المناسبة.
 */

// --- 1. دالة التهيئة الرئيسية ---

/**
 * تقوم بتهيئة التطبيق عند تحميل الصفحة.
 * تستدعي دوال التهيئة من الوحدات الأخرى.
 */
async function initialize() {
    console.log("التطبيق قيد التشغيل...");
    
    // استدعاء دالات التهيئة بالتوازي لزيادة السرعة
    // التطبيق سينتظر هنا حتى يتم جلب كل الإعدادات من لوحة التحكم
    await Promise.all([
        quiz.initializeQuiz(),
        progression.initializeProgression()
    ]);

    console.log("تم جلب جميع الإعدادات. التطبيق جاهز.");

    // ربط الأحداث الرئيسية في واجهة المستخدم
    setupEventListeners();
    
    // إظهار شاشة البداية
    ui.showScreen(ui.startScreen);
}

// --- 2. ربط الأحداث (Event Listeners) ---

function setupEventListeners() {
    // إضافة "debouncing" لحدث إدخال اسم المستخدم
    // هذا يمنع إرسال طلبات كثيرة للخادم أثناء الكتابة
    let debounceTimer;
    ui.userNameInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleUserLogin();
        }
    });
    
    // ربط حدث النقر على زر "ابدأ الاختبار"
    ui.startButton.addEventListener('click', onStartButtonClick);
    
    // ربط زر "العودة إلى القائمة الرئيسية" في شاشة النتائج
    ui.reloadButton.addEventListener('click', () => location.reload());
}

/**
 * يتم تشغيلها عند ضغط Enter في حقل اسم المستخدم.
 * تقوم بتحميل بيانات اللاعب وعرضها.
 */
async function handleUserLogin() {
    const userName = ui.userNameInput.value.trim();
    if (!userName) {
        alert('الرجاء إدخال اسمك أولاً.');
        return;
    }

    ui.toggleLoader(true);
    const playerLoaded = await player.loadPlayer(userName);
    ui.toggleLoader(false);

    if (playerLoaded) {
        // إذا تم تحميل اللاعب بنجاح، اعرض معلوماته
        const levelInfo = progression.getLevelInfo(player.playerData.xp);
        ui.updatePlayerDisplay(player.playerData, levelInfo);
        ui.userNameInput.disabled = true; // تعطيل حقل الاسم بعد الدخول
    }
}

/**
 * يتم تشغيل هذه الدالة عند النقر على زر "ابدأ الاختبار".
 */
async function onStartButtonClick() {
    // التحقق من أن المستخدم قد قام بتسجيل الدخول أولاً
    if (ui.userNameInput.disabled === false) {
        alert("الرجاء إدخال اسمك والضغط على Enter أولاً.");
        return;
    }

    // جمع إعدادات الاختبار من حقول الإدخال
    const pageNumber = ui.pageNumberInput.value;
    const questionsCount = parseInt(ui.questionsCountSelect.value);
    const selectedQari = ui.qariSelect.value;

    // التحقق من صحة رقم الصفحة
    if (!pageNumber || pageNumber < 1 || pageNumber > 604) {
        alert('الرجاء إدخال رقم صفحة صحيح (بين 1 و 604).');
        return;
    }

    ui.toggleLoader(true);
    const ayahs = await fetchPageData(pageNumber);
    ui.toggleLoader(false);

    if (ayahs) {
        // إذا تم جلب الآيات بنجاح، ابدأ الاختبار
        quiz.start({
            pageAyahs: ayahs,
            totalQuestions: questionsCount,
            selectedQari: selectedQari,
            userName: player.playerData.name,
            pageNumber: pageNumber
        });
    }
}

// --- 3. تشغيل التطبيق ---
// استدعاء دالة التهيئة لبدء كل شيء.
initialize();
