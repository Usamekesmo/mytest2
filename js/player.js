// js/player.js

import { fetchPlayer, savePlayer as savePlayerToApi } from './api.js';

/**
 * هذا الكائن سيحتفظ ببيانات اللاعب الحالية أثناء استخدام التطبيق.
 * إنه "مصدر الحقيقة" لبيانات اللاعب داخل الجلسة الحالية.
 */
export let playerData = {
    name: '',
    xp: 0,
    diamonds: 0,
    isNew: true // لتحديد ما إذا كان اللاعب جديدًا
};

/**
 * يقوم بتحميل بيانات اللاعب من السحابة (Google Sheets).
 * إذا لم يتم العثور على اللاعب، فإنه يقوم بإعداد بيانات لاعب جديد.
 * @param {string} userName - اسم المستخدم الذي تم إدخاله.
 * @returns {Promise<boolean>} - true إذا تم التحميل بنجاح (سواء كان اللاعب جديدًا أو قديمًا).
 *                               false إذا حدث خطأ في الشبكة.
 */
export async function loadPlayer(userName) {
    // استدعاء الدالة من api.js لجلب البيانات
    const fetchedData = await fetchPlayer(userName);

    if (fetchedData === 'error') {
        // حدث خطأ في الشبكة أثناء محاولة جلب البيانات
        alert("خطأ في الاتصال بالخادم لجلب بياناتك. يرجى المحاولة مرة أخرى.");
        return false;
    }

    if (fetchedData) {
        // تم العثور على اللاعب في السحابة
        playerData = { ...fetchedData, isNew: false };
        console.log(`مرحباً بعودتك أيها اللاعب القديم: ${playerData.name}`);
    } else {
        // لم يتم العثور على اللاعب، فهو لاعب جديد
        playerData = { name: userName, xp: 0, diamonds: 0, isNew: true };
        console.log(`مرحباً بك أيها اللاعب الجديد: ${userName}`);
    }
    
    return true;
}

/**
 * يحفظ بيانات اللاعب الحالية في السحابة (Google Sheets).
 * يستدعي الدالة من api.js لإرسال البيانات.
 */
export async function savePlayer() {
    // لا نحتاج إلى حفظ خاصية 'isNew' في قاعدة البيانات، فهي خاصة بالجلسة الحالية فقط.
    // نستخدم "destructuring" لإنشاء كائن جديد بدون هذه الخاصية.
    const { isNew, ...dataToSave } = playerData;
    
    await savePlayerToApi(dataToSave);
    
    console.log("تم إرسال طلب حفظ بيانات اللاعب إلى السحابة.");
}
