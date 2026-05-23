// file: api/check-status.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Tắt cache hoàn toàn
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    if (req.method !== 'GET') {
        return res.status(405).json({ paid: false });
    }

    const { orderId } = req.query;
    if (!orderId) {
        return res.status(400).json({ paid: false, message: 'Missing orderId' });
    }

    try {
        const data = await kv.get(`order:${orderId}`);
        console.log(`Kiểm tra order:${orderId} →`, data);

        if (data && data.paid) {
            return res.status(200).json({ paid: true, orderId, ...data });
        }

        return res.status(200).json({ paid: false, orderId });

    } catch (error) {
        console.error("Lỗi check-status:", error);
        return res.status(500).json({ paid: false, message: 'Server error' });
    }
}
