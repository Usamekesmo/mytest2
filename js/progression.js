// js/progression.js

import { fetchProgressionConfig } from './api.js';

// هذا الكائن سيحتفظ بالإعدادات التي تم جلبها من لوحة التحكم
let config = {
    levels: [],
    store: []
};

/**
 * دالة التهيئة، تقوم بجلب إعدادات التقدم (المستويات والمتجر) من لوحة التحكم.
 * يجب استدعاؤها عند بدء تشغيل التطبيق.
 */
export async function initializeProgression() {
    const fetchedConfig = await fetchProgressionConfig();
    if (fetchedConfig) {
        config = fetchedConfig;
        // ترتيب المستويات تصاعدياً حسب المستوى هو أمر حاسم لضمان صحة العمليات الحسابية التالية
        if (config.levels) {
            config.levels.sort((a, b) => a.level - b.level);
        }
        console.log("تم جلب وتهيئة إعدادات التقدم (المستويات والمتجر) بنجاح.");
    } else {
        console.error("فشل فادح: لم يتم جلب إعدادات التقدم. لن يعمل نظام المستويات.");
    }
}

/**
 * يحسب معلومات المستوى الحالي للاعب بناءً على نقاط خبرته.
 * @param {number} currentXp - نقاط الخبرة الحالية للاعب.
 * @returns {object} - كائن يحتوي على معلومات المستوى الحالي والتالي.
 */
export function getLevelInfo(currentXp) {
    // في حالة عدم وجود إعدادات للمستويات، يتم إرجاع قيم افتراضية
    if (!config.levels || config.levels.length === 0) {
        return { level: 1, title: 'لاعب جديد', progress: 0, nextLevelXp: 100 };
    }

    let currentLevelInfo = config.levels[0];
    
    // نبحث عن المستوى الحالي بالمرور على المستويات من الأعلى إلى الأدنى
    // آخر مستوى تكون نقاط خبرة اللاعب أكبر من أو تساوي متطلباته هو مستواه الحالي.
    for (let i = config.levels.length - 1; i >= 0; i--) {
        if (currentXp >= config.levels[i].xpRequired) {
            currentLevelInfo = config.levels[i];
            break;
        }
    }

    // البحث عن معلومات المستوى التالي
    const nextLevelIndex = config.levels.findIndex(l => l.level === currentLevelInfo.level + 1);
    const nextLevelInfo = nextLevelIndex !== -1 ? config.levels[nextLevelIndex] : null;

    // حساب نسبة التقدم المئوية للمستوى التالي
    const xpForCurrentLevel = currentLevelInfo.xpRequired;
    const xpForNextLevel = nextLevelInfo ? nextLevelInfo.xpRequired : currentXp; // إذا كان آخر مستوى، فالهدف هو نقاطه الحالية
    
    let progressPercentage = 100; // الافتراضي هو 100% إذا كان هذا هو أعلى مستوى
    if (nextLevelInfo && xpForNextLevel > xpForCurrentLevel) {
        progressPercentage = ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    }

    return {
        level: currentLevelInfo.level,
        title: currentLevelInfo.title,
        progress: Math.min(100, progressPercentage), // لضمان عدم تجاوز 100%
        nextLevelXp: xpForNextLevel,
        currentLevelXp: xpForCurrentLevel
    };
}

/**
 * يتحقق مما إذا كان اللاعب قد ترقى لمستوى جديد بعد كسب نقاط خبرة.
 * @param {number} oldXp - نقاط الخبرة قبل الاختبار.
 * @param {number} newXp - نقاط الخبرة بعد الاختبار.
 * @returns {object|null} - معلومات المستوى الجديد إذا تمت الترقية، وإلا null.
 */
export function checkForLevelUp(oldXp, newXp) {
    const oldLevelInfo = getLevelInfo(oldXp);
    const newLevelInfo = getLevelInfo(newXp);

    if (newLevelInfo.level > oldLevelInfo.level) {
        // تمت الترقية!
        // ابحث عن بيانات المستوى الجديد للحصول على المكافأة
        const newLevelData = config.levels.find(l => l.level === newLevelInfo.level);
        return {
            ...newLevelInfo,
            reward: newLevelData ? newLevelData.diamondsReward : 0
        };
    }
    
    return null; // لم تتم الترقية
}
