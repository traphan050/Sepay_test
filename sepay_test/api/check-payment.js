import { kv } from '@vercel/kv';

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

    try {
        // Đọc dữ liệu từ Database (Redis/KV) do Webhook ghi vào
        const data = await kv.get(`order:${orderId}`);

        if (data && data.paid) {
            console.log(`[check-payment] ✅ Đơn ${orderId} ĐÃ THANH TOÁN`);
            return res.status(200).json({
                paid: true,
                orderId,
                amount: data.amount,
                paidAt: data.paidAt
            });
        }

        console.log(`[check-payment] ⏳ Đơn ${orderId} đang chờ...`);
        return res.status(200).json({ paid: false, orderId });

    } catch (error) {
        console.error('[check-payment] Lỗi:', error.message);
        return res.status(200).json({ paid: false, orderId, debug: error.message });
    }
}
