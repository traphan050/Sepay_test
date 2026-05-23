import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        // Xác thực API Key
        const EXPECTED_API_KEY = process.env.SEPAY_API_KEY || '';
        if (EXPECTED_API_KEY) {
            const authHeader = req.headers['authorization'];
            const token = (authHeader || '').replace('Apikey ', '');
            if (!authHeader || token !== EXPECTED_API_KEY) {
                console.error('Xác thực thất bại. Header nhận được:', authHeader);
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
        } else {
            console.warn('⚠️ SEPAY_API_KEY chưa cấu hình - đang bỏ qua xác thực');
        }

        const payload = req.body;
        console.log('====== WEBHOOK SEPAY ======');
        console.log('Mã đơn:', payload.code);
        console.log('Số tiền:', payload.transferAmount, 'VNĐ');
        console.log('Nội dung:', payload.content);
        
        // Chỉ xử lý khi có tiền vào (in) và có nội dung/code
        if (payload.transferType === 'in') {
            // Lấy mã đơn hàng từ trường code (do SePay bóc tách) hoặc từ nội dung chuyển khoản
            const orderCode = payload.code;

            if (orderCode) {
                // Lưu vào Database (Redis/KV)
                // Lưu trạng thái thành công với thời gian sống là 24 giờ (86400 giây)
                await kv.set(`order:${orderCode}`, {
                    paid: true,
                    amount: payload.transferAmount,
                    paidAt: new Date().toISOString()
                }, { ex: 86400 });
                
                console.log(`✅ Đã lưu vào Database: order:${orderCode} = PAID`);
            } else {
                console.log('⚠️ Không tìm thấy mã đơn hàng trong giao dịch này');
            }
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Lỗi webhook:', error);
        return res.status(500).json({ success: false });
    }
}
