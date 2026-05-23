// file: api/check-status.js
// Frontend gọi API này để hỏi: "Đơn hàng X đã được thanh toán chưa?"

import { readFileSync } from 'fs';

const ORDERS_FILE = '/tmp/paid_orders.json';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ paid: false, message: 'Method Not Allowed' });
    }

    const { orderId } = req.query;
    if (!orderId) {
        return res.status(400).json({ paid: false, message: 'Missing orderId' });
    }

    try {
        const raw = readFileSync(ORDERS_FILE, 'utf-8');
        const paidOrders = JSON.parse(raw);
        const isPaid = !!paidOrders[orderId];
        return res.status(200).json({ paid: isPaid, orderId });
    } catch {
        // File chưa tồn tại → chưa có đơn nào được thanh toán
        return res.status(200).json({ paid: false, orderId });
    }
}
