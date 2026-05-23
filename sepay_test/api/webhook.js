// file: api/webhook.js
// Tài liệu Vercel Serverless Functions: https://vercel.com/docs/functions/serverless-functions

export default async function handler(req, res) {
    // 1. Chỉ chấp nhận phương thức POST (vì SePay gửi POST)
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        // 2. Kiểm tra API Key bảo mật từ Header
        // Trong Vercel, cài đặt biến môi trường SEPAY_API_KEY ở phần Settings
        // Trong lúc code ở local, nếu không có thì mặc định rỗng.
        const EXPECTED_API_KEY = process.env.SEPAY_API_KEY || ''; 
        
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            console.error("Lỗi: Thiếu header Authorization");
            return res.status(401).json({ success: false, message: 'Missing Authorization header' });
        }

        const token = authHeader.replace('Apikey ', '');
        if (token !== EXPECTED_API_KEY) {
            console.error("Lỗi: Sai API Key", { received: token });
            return res.status(401).json({ success: false, message: 'Invalid API Key' });
        }

        // 3. Xử lý Payload (Dữ liệu chuyển khoản)
        const payload = req.body;
        console.log("============= NHẬN WEBHOOK SEPAY =============");
        console.log(`Giao dịch ID: ${payload.id}`);
        console.log(`Số tiền: ${payload.transferAmount} VNĐ`);
        console.log(`Nội dung CK: ${payload.content}`);
        console.log(`Mã đơn hàng (nếu nhận diện được): ${payload.code}`);
        console.log("==============================================");

        // 4. Kiểm tra xem có đúng là tiền VÀO không
        if (payload.transferType === 'in') {
            const orderCode = payload.code;
            const amount = payload.transferAmount;

            // TẠI ĐÂY BẠN LÀM LOGIC CẬP NHẬT DATABASE
            // Ví dụ:
            // - Kết nối Firebase/Supabase
            // - Update document có id là orderCode thành status = 'PAID'
            // - Gửi email thông báo cho khách...
            console.log(`✅ Xác nhận thanh toán thành công cho đơn: ${orderCode} với số tiền ${amount} đ`);
        }

        // 5. Trả về đúng định dạng SePay yêu cầu trong vòng 30s
        // Bắt buộc status 200 và json { "success": true }
        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error("Lỗi xử lý webhook:", error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
