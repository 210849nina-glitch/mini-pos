// API Route ฝั่ง server สำหรับส่งข้อความแจ้งเตือนเข้า Telegram
// เก็บ token ไว้ฝั่ง server เท่านั้น ไม่ให้หลุดไปกับ JS bundle ฝั่ง browser
export async function POST(request) {
  try {
    const { message } = await request.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return Response.json(
        { ok: false, error: "Telegram config ไม่ครบ" },
        { status: 500 }
      );
    }

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await telegramRes.json();

    if (!data.ok) {
      return Response.json({ ok: false, error: data.description }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
