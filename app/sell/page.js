  // ยิงข้อความแจ้งเตือนเข้า Telegram ผ่าน API route ของเราเอง
  // ทำงานแบบ fire-and-forget: ถ้าพลาดจะไม่กระทบขั้นตอนขายสินค้า
  const sendTelegramNotification = async (message) => {
    try {
      await fetch("/api/notify-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
    } catch (err) {
      console.error("ส่ง Telegram แจ้งเตือนไม่สำเร็จ:", err);
    }
  };
