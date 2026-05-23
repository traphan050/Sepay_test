// file: api/check-payment.js
export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    if (req.method !== 'GET') {
        return res.status(405).json({ paid: false });
    }

    const { orderId } = req.query;
    if (!orderId) {
        return res.status(400).json({ paid: false, message: 'Thiếu orderId' });
    }

    const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;
    if (!SEPAY_API_TOKEN) {
        // Chưa cấu hình token → trả paid: false thay vì 500
        console.warn('[check-payment] Chưa có SEPAY_API_TOKEN trong env vars!');
        return res.status(200).json({ paid: false, orderId, debug: 'missing_token' });
    }

    try {
        // Gọi SePay API - tìm giao dịch theo nội dung chuyển khoản
        const url = `https://my.sepay.vn/userapi/transactions/list?transaction_description=${encodeURIComponent(orderId)}&limit=5`;
        console.log('[check-payment] Gọi:', url);

        const sePayRes = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SEPAY_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        const rawText = await sePayRes.text();
        console.log('[check-payment] SePay status:', sePayRes.status);
        console.log('[check-payment] SePay raw response:', rawText.substring(0, 500));

        if (!sePayRes.ok) {
            console.error('[check-payment] SePay API lỗi:', sePayRes.status);
            return res.status(200).json({ paid: false, orderId, debug: `sepay_error_${sePayRes.status}` });
        }

        const result = JSON.parse(rawText);

        // SePay có thể trả về nhiều cấu trúc khác nhau
        const transactions = result?.transactions
            || result?.data
            || result?.data?.transactions
            || [];

        console.log('[check-payment] Tổng giao dịch tìm được:', transactions.length);

        // Tìm giao dịch có nội dung chứa mã đơn hàng
        const matched = transactions.find(tx => {
            const content = (
                tx.transaction_content ||
                tx.content ||
                tx.description ||
                ''
            ).toUpperCase();
            return content.includes(orderId.toUpperCase());
        });

        if (matched) {
            console.log('[check-payment] ✅ Tìm thấy:', matched);
            return res.status(200).json({
                paid: true,
                orderId,
                amount: matched.amount_in || matched.transferAmount || matched.amount,
                paidAt: matched.transaction_date || matched.transactionDate,
            });
        }

        return res.status(200).json({ paid: false, orderId });

    } catch (error) {
        console.error('[check-payment] Lỗi:', error.message);
        // Trả 200 thay vì 500 để frontend không bị crash
        return res.status(200).json({ paid: false, orderId, debug: error.message });
    }
}
