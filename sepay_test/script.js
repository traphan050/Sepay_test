document.addEventListener('DOMContentLoaded', () => {
    const buyButton = document.getElementById('buyButton');
    const backButton = document.getElementById('backButton');
    const productCard = document.getElementById('productCard');
    const paymentCard = document.getElementById('paymentCard');
    const orderIdDisplay = document.getElementById('orderIdDisplay');
    const qrImage = document.getElementById('qrImage');
    const qrLoader = document.getElementById('qrLoader');

    // CẤU HÌNH NGÂN HÀNG CỦA BẠN TẠI ĐÂY
    const BANK_ID = "MB";
    const ACCOUNT_NO = "0927319622";
    const ACCOUNT_NAME = "NGUYEN TRUONG AN";
    const AMOUNT = 2000;
    const SEPAY_PREFIX = "DH";

    let pollingInterval = null; // lưu timer để có thể dừng sau này

    buyButton.addEventListener('click', () => {
        // Tạo mã đơn hàng ngẫu nhiên
        const randomOrderCode = Math.floor(10000 + Math.random() * 90000);
        const orderId = `${SEPAY_PREFIX}${randomOrderCode}`;

        orderIdDisplay.textContent = orderId;

        // Chuyển sang màn hình thanh toán
        productCard.classList.add('hidden');
        paymentCard.classList.remove('hidden');

        // Tạo QR code
        qrImage.classList.add('hidden');
        qrLoader.classList.remove('hidden');

        const transferContent = orderId;
        const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${AMOUNT}&addInfo=${transferContent}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

        qrImage.src = qrUrl;
        qrImage.onload = () => {
            qrLoader.classList.add('hidden');
            qrImage.classList.remove('hidden');
        };

        // Bắt đầu polling kiểm tra trạng thái thanh toán (mỗi 3 giây)
        if (pollingInterval) clearInterval(pollingInterval);
        pollingInterval = setInterval(() => checkPaymentStatus(orderId), 3000);
    });

    backButton.addEventListener('click', () => {
        paymentCard.classList.add('hidden');
        productCard.classList.remove('hidden');
        // Dừng polling khi quay lại
        if (pollingInterval) clearInterval(pollingInterval);
    });

    async function checkPaymentStatus(orderId) {
        try {
            // Gọi SePay API qua proxy, thêm timestamp tránh cache
            const res = await fetch(`/api/check-payment?orderId=${orderId}&t=${Date.now()}`);
            const data = await res.json();

            if (data.paid) {
                // Dừng polling, không cần hỏi nữa
                clearInterval(pollingInterval);

                // Cập nhật giao diện trạng thái
                const statusBadge = document.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = '✅ Thanh toán thành công!';
                    statusBadge.style.background = '#d1fae5';
                    statusBadge.style.color = '#065f46';
                }

                // Sau 2 giây → hiện thông báo thành công lớn
                setTimeout(() => {
                    showSuccessScreen(orderId);
                }, 2000);
            }
        } catch (err) {
            console.error('Lỗi kiểm tra trạng thái:', err);
        }
    }

    function showSuccessScreen(orderId) {
        paymentCard.innerHTML = `
            <div style="text-align:center; padding: 32px 16px;">
                <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
                <h2 style="color: #065f46; font-size: 1.5rem; margin-bottom: 8px;">Thanh toán thành công!</h2>
                <p style="color: #6b7280; margin-bottom: 16px;">Đơn hàng <strong>${orderId}</strong> đã được xác nhận.</p>
                <p style="color: #6b7280; font-size: 0.85rem;">Chúng tôi sẽ xử lý và giao hàng sớm nhất có thể.</p>
                <button onclick="location.reload()" style="margin-top:24px; background:#3b82f6; color:white; border:none; padding:12px 24px; border-radius:8px; font-size:1rem; cursor:pointer;">
                    Mua thêm sản phẩm
                </button>
            </div>
        `;
    }
});
