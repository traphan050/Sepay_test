// file: api/webhook.js
import { readFileSync, writeFileSync } from 'fs';

const ORDERS_FILE = '/tmp/paid_orders.json';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        // Kiểm tra API Key bảo mật
        const EXPECTED_API_KEY = process.env.SEPAY_API_KEY || '';
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            console.error("Lỗi: Thiếu header Authorization");
            return res.status(401).json({ success: false, message: 'Missing Authorization header' });
        }

        const token = authHeader.replace('Apikey ', '');
        if (token !== EXPECTED_API_KEY) {
            console.error("Lỗi: Sai API Key");
            return res.status(401).json({ success: false, message: 'Invalid API Key' });
        }

        // Xử lý payload
        const payload = req.body;
        console.log("============= NHẬN WEBHOOK SEPAY =============");
        console.log(`Giao dịch ID: ${payload.id}`);
        console.log(`Số tiền: ${payload.transferAmount} VNĐ`);
        console.log(`Nội dung CK: ${payload.content}`);
        console.log(`Mã đơn hàng: ${payload.code}`);
        console.log("==============================================");

        // Nếu tiền vào và có mã đơn hàng → ghi vào file tạm
        if (payload.transferType === 'in' && payload.code) {
            const orderCode = payload.code;
            const amount = payload.transferAmount;

            // Đọc danh sách đơn hiện có
            let paidOrders = {};
            try {
                const raw = readFileSync(ORDERS_FILE, 'utf-8');
                paidOrders = JSON.parse(raw);
            } catch {
                // File chưa có, tạo mới
            }

            // Ghi đơn hàng mới vào
            paidOrders[orderCode] = {
                amount,
                paidAt: new Date().toISOString(),
                transactionId: payload.id,
            };

            writeFileSync(ORDERS_FILE, JSON.stringify(paidOrders), 'utf-8');
            console.log(`✅ Đã ghi nhận thanh toán: ${orderCode} = ${amount} đ`);
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Lỗi xử lý webhook:", error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
