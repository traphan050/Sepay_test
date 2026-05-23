document.addEventListener('DOMContentLoaded', () => {
    const buyButton = document.getElementById('buyButton');
    const backButton = document.getElementById('backButton');
    const productCard = document.getElementById('productCard');
    const paymentCard = document.getElementById('paymentCard');
    const orderIdDisplay = document.getElementById('orderIdDisplay');
    const qrImage = document.getElementById('qrImage');
    const qrLoader = document.getElementById('qrLoader');

    // CẤU HÌNH NGÂN HÀNG CỦA BẠN TẠI ĐÂY
    // Dùng API của VietQR (vietqr.io)
    const BANK_ID = "MB"; // Thay bằng mã ngân hàng của bạn (VD: VCB, TCBM, MB, BIDV)
    const ACCOUNT_NO = "0927319622"; // Thay bằng Số tài khoản ngân hàng của bạn
    const ACCOUNT_NAME = "NGUYEN TRUONG AN"; // Tên chủ tài khoản
    const AMOUNT = 2000; // Số tiền (2,500,000 VNĐ)
    const SEPAY_PREFIX = "DH"; // Tiền tố mã đơn hàng (giống cấu hình trên SePay)

    buyButton.addEventListener('click', () => {
        // Tạo mã đơn hàng ngẫu nhiên, ví dụ: DH58392
        const randomOrderCode = Math.floor(10000 + Math.random() * 90000);
        const orderId = `${SEPAY_PREFIX}${randomOrderCode}`;

        // Hiển thị mã đơn hàng lên UI
        orderIdDisplay.textContent = orderId;

        // Nội dung chuyển khoản
        const transferContent = orderId;

        // Chuyển đổi giao diện
        productCard.classList.add('hidden');
        paymentCard.classList.remove('hidden');

        // Tạo mã QR bằng API vietqr.io
        qrImage.classList.add('hidden');
        qrLoader.classList.remove('hidden');

        // Format URL sinh mã QR của VietQR
        const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${AMOUNT}&addInfo=${transferContent}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

        // Load QR Code
        qrImage.src = qrUrl;
        qrImage.onload = () => {
            qrLoader.classList.add('hidden');
            qrImage.classList.remove('hidden');
        };
    });

    backButton.addEventListener('click', () => {
        paymentCard.classList.add('hidden');
        productCard.classList.remove('hidden');
    });

    // Lưu ý thực tế: 
    // Trong ứng dụng thật, bạn nên dùng `setInterval` để gọi một API (VD: /api/check-order-status)
    // để kiểm tra xem Webhook của SePay đã xác nhận đơn hàng hay chưa. 
    // Khi đơn hàng chuyển trạng thái "Đã thanh toán", điều hướng người dùng sang trang Thành công.
});
