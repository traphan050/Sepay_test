// file: api/webhook.js
// Chỉ cần nhận webhook và trả 200 cho SePay
// Việc kiểm tra trạng thái được làm qua /api/check-payment

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        // Xác thực API Key
        const EXPECTED_API_KEY = process.env.SEPAY_API_KEY || '';
        const authHeader = req.headers['authorization'];
        const token = (authHeader || '').replace('Apikey ', '');

        if (!authHeader || token !== EXPECTED_API_KEY) {
            console.error('Xác thực thất bại:', authHeader);
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // In thông tin giao dịch
        const payload = req.body;
        console.log('====== WEBHOOK SEPAY ======');
        console.log('Mã đơn:', payload.code);
        console.log('Số tiền:', payload.transferAmount, 'VNĐ');
        console.log('Nội dung:', payload.content);
        console.log('Loại:', payload.transferType);
        console.log('===========================');

        // Chỉ cần trả 200, việc check paid do frontend tự hỏi SePay API
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Lỗi webhook:', error);
        return res.status(500).json({ success: false });
    }
}
