// js/api.js

import { API_BASE_URL, SCRIPT_URL } from './config.js';

// =================================================================
// --- دوال جلب البيانات من الخوادم (GET Requests) ---
// =================================================================

/**
 * يجلب بيانات الآيات والأسطر لصفحة معينة من واجهة alquran.cloud.
 * @param {number} pageNumber - رقم الصفحة المطلوب (1-604).
 * @returns {Promise<Array|null>} - مصفوفة من كائنات الآيات أو null عند الفشل.
 */
export async function fetchPageData(pageNumber) {
    try {
        const [pageResponse, linesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/page/${pageNumber}/quran-uthmani`),
            fetch(`${API_BASE_URL}/page/${pageNumber}/quran-uthmani-lines`)
        ]);

        if (!pageResponse.ok || !linesResponse.ok) {
            throw new Error(`فشل في جلب بيانات الصفحة: ${pageResponse.statusText}`);
        }

        const pageData = await pageResponse.json();
        const linesData = await linesResponse.json();

        if (pageData.code === 200 && pageData.data.ayahs.length >= 4 && linesData.code === 200) {
            return pageData.data.ayahs.map(ayah => {
                const lineInfo = linesData.data.ayahs.find(la => la.number === ayah.number);
                return { ...ayah, line: lineInfo ? lineInfo.line : null };
            });
        } else {
            alert('هذه الصفحة لا تحتوي على 4 آيات على الأقل، أو حدث خطأ في البيانات.');
            return null;
        }
    } catch (error) {
        console.error("Error in fetchPageData:", error);
        alert('لا يمكن الوصول إلى خادم القرآن. تحقق من اتصالك بالإنترنت.');
        return null;
    }
}

/**
 * يجلب بيانات لاعب معين من Google Sheets.
 * @param {string} userName - اسم اللاعب.
 * @returns {Promise<object|null|'error'>} - كائن ببيانات اللاعب، null إذا لم يوجد، أو 'error' عند الفشل.
 */
export async function fetchPlayer(userName) {
    const url = `${SCRIPT_URL}?action=getPlayer&userName=${encodeURIComponent(userName)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب بيانات اللاعب من الخادم.');
        
        const data = await response.json();
        if (data.result === 'success') return data.player;
        if (data.result === 'notFound') return null;
        throw new Error(data.message);
    } catch (error) {
        console.error("Error fetching player data:", error);
        return 'error';
    }
}

/**
 * يجلب إعدادات الأسئلة المفعّلة من لوحة التحكم في Google Sheets.
 * @returns {Promise<Array|null>} - مصفوفة بكائنات الأسئلة المفعّلة أو null.
 */
export async function fetchQuestionsConfig() {
    const url = `${SCRIPT_URL}?action=getQuestionsConfig`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب إعدادات الأسئلة.');
        const data = await response.json();
        return (data.result === 'success') ? data.questions : null;
    } catch (error) {
        console.error("Error fetching questions config:", error);
        return null;
    }
}

/**
 * يجلب إعدادات التقدم (المستويات والمتجر) من لوحة التحكم.
 * @returns {Promise<object|null>} - كائن يحتوي على مصفوفتي levels و store.
 */
export async function fetchProgressionConfig() {
    const url = `${SCRIPT_URL}?action=getProgressionConfig`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب إعدادات التقدم.');
        const data = await response.json();
        return (data.result === 'success') ? data.config : null;
    } catch (error) {
        console.error("Error fetching progression config:", error);
        return null;
    }
}


// =================================================================
// --- دوال إرسال البيانات إلى الخوادم (POST Requests) ---
// =================================================================

/**
 * يحفظ (يحدّث أو ينشئ) بيانات اللاعب في Google Sheets.
 * @param {object} playerData - كائن يحتوي على بيانات اللاعب.
 * @returns {Promise<boolean>} - true عند النجاح.
 */
export async function savePlayer(playerData) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // وضع no-cors لا يعيد استجابة، لذا لا يمكننا التحقق من النجاح هنا
            body: JSON.stringify({
                action: 'updatePlayer',
                payload: playerData
            })
        });
        return true;
    } catch (error) {
        console.error("Error saving player data:", error);
        return false;
    }
}

/**
 * يحفظ نتيجة الاختبار (لأغراض التحليل).
 * @param {object} resultData - بيانات الاختبار.
 * @returns {Promise<boolean>} - true عند النجاح.
 */
export async function saveResult(resultData) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                action: 'saveResult',
                payload: resultData
            })
        });
        return true;
    } catch (error) {
        console.error("Error saving result:", error);
        return false;
    }
}
