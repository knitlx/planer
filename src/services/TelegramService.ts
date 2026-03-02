export class TelegramService {
  static async sendMessage(chatId: number, message: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
          }),
        },
      );

      return response.ok;
    } catch (error) {
      console.error("Telegram send failed:", error);
      return false;
    }
  }
}
