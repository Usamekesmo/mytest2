// js/api.js

/**
 * =================================================================
 * وحدة واجهة برمجة التطبيقات (API Module)
 * =================================================================
 * هذا الملف مسؤول عن كل عمليات التواصل مع الخوادم الخارجية (الشبكة).
 * يتضمن جلب بيانات القرآن من واجهة alquran.cloud، وإرسال
 * النتائج إلى Google Sheets عبر السكربت الخاص بنا.
 * =================================================================
 */

// استيراد الإعدادات من ملف config.js
import { API_BASE_URL, SCRIPT_URL } from './config.js';

/**
 * يجلب بيانات الآيات والأسطر لصفحة معينة من واجهة alquran.cloud.
 * @param {number} pageNumber - رقم الصفحة المطلوب (1-604).
 * @returns {Promise<Array|null>} - عند النجاح، يعيد مصفوفة من كائنات الآيات.
 *                                  عند الفشل، يعيد null.
 */
export async function fetchPageData(pageNumber) {
    try {
        // نستخدم Promise.all لإرسال الطلبين في نفس الوقت لزيادة السرعة
        const [pageResponse, linesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/page/${pageNumber}/quran-uthmani`),
            fetch(`${API_BASE_URL}/page/${pageNumber}/quran-uthmani-lines`)
        ]);

        // التأكد من أن كلا الطلبين نجحا
        if (!pageResponse.ok || !linesResponse.ok) {
            // throw new Error(...) سينتقل التنفيذ مباشرة إلى قسم catch
            throw new Error(`فشل في جلب البيانات: ${pageResponse.statusText}`);
        }

        const pageData = await pageResponse.json();
        const linesData = await linesResponse.json();

        // التحقق من أن البيانات المستلمة صالحة
        if (pageData.code === 200 && pageData.data.ayahs.length >= 4 && linesData.code === 200) {
            // دمج معلومات الأسطر مع الآيات
            return pageData.data.ayahs.map(ayah => {
                const lineInfo = linesData.data.ayahs.find(la => la.number === ayah.number);
                return { ...ayah, line: lineInfo ? lineInfo.line : null };
            });
        } else {
            // إذا كانت البيانات غير صالحة (مثلاً، صفحة لا تحتوي على آيات كافية)
            alert('هذه الصفحة لا تحتوي على 4 آيات على الأقل، أو حدث خطأ في البيانات المستلمة.');
            return null;
        }
    } catch (error) {
        // هذا القسم يلتقط أي خطأ يحدث في الشبكة أو في الكود أعلاه
        console.error("Error in fetchPageData:", error);
        alert('لا يمكن الوصول إلى الخادم. تحقق من اتصالك بالإنترنت.');
        return null;
    }
}

/**
 * يرسل بيانات النتيجة النهائية إلى ورقة Google Sheets.
 * @param {object} resultData - كائن يحتوي على بيانات النتيجة (userName, score, etc.).
 * @returns {Promise<boolean>} - يعيد true إذا تم إرسال الطلب بنجاح، و false في حالة الفشل.
 */
export async function saveResultToSheet(resultData) {
    // التحقق من أن المستخدم قد وضع رابط السكربت في ملف الإعدادات
    if (!SCRIPT_URL || SCRIPT_URL === "هنا-الصق-الرابط-الذي-نسخته-من-جوجل") {
        console.error("خطأ فادح: رابط Google Apps Script غير موجود في config.js!");
        return false;
    }

    try {
        // إرسال البيانات باستخدام fetch
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // هذا الوضع مطلوب عند التعامل مع Apps Script بهذه الطريقة
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow',
            body: JSON.stringify(resultData)
        });
        
        console.log("تم إرسال طلب الحفظ إلى Google Sheets بنجاح.");
        return true; // تم إرسال الطلب بنجاح

    } catch (error) {
        console.error('فشل في إرسال النتيجة إلى Google Sheets:', error);
        return false; // فشل إرسال الطلب
    }
}
