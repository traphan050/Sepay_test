// file: api/check-payment.js
// Gọi thẳng SePay API để kiểm tra giao dịch - KHÔNG cần database

export default async function handler(req, res) {
    // Tắt cache để browser không trả 304
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
        console.error('Thiếu biến môi trường SEPAY_API_TOKEN');
        return res.status(500).json({ paid: false, message: 'Server chưa cấu hình API Token' });
    }

    try {
        // Gọi SePay API để tìm giao dịch khớp với mã đơn hàng
        const sePayUrl = `https://my.sepay.vn/userapi/transactions/list?transaction_description=${encodeURIComponent(orderId)}&limit=5`;

        const sePayRes = await fetch(sePayUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SEPAY_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!sePayRes.ok) {
            const errText = await sePayRes.text();
            console.error('SePay API lỗi:', sePayRes.status, errText);
            return res.status(200).json({ paid: false, message: 'Lỗi gọi SePay API' });
        }

        const result = await sePayRes.json();
        console.log(`Kiểm tra ${orderId}:`, JSON.stringify(result));

        // SePay trả về mảng transactions
        const transactions = result?.transactions || result?.data || [];

        // Tìm giao dịch có nội dung chứa mã đơn hàng
        const matched = transactions.find(tx => {
            const content = (tx.transaction_content || tx.content || '').toUpperCase();
            return content.includes(orderId.toUpperCase());
        });

        if (matched) {
            return res.status(200).json({
                paid: true,
                orderId,
                amount: matched.amount_in || matched.transferAmount,
                paidAt: matched.transaction_date || matched.transactionDate,
            });
        }

        return res.status(200).json({ paid: false, orderId });

    } catch (error) {
        console.error('Lỗi check-payment:', error);
        return res.status(500).json({ paid: false, message: 'Lỗi server' });
    }
}
