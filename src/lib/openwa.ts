const OPENWA_URL = process.env.OPENWA_URL;
const OPENWA_API_KEY = process.env.OPENWA_API_KEY;
const OPENWA_SESSION_ID = process.env.OPENWA_SESSION_ID;

export async function sendWhatsAppText(phone: string, text: string) {
  if (!OPENWA_URL || !OPENWA_API_KEY || !OPENWA_SESSION_ID) {
    throw new Error("OpenWA no está configurado (faltan OPENWA_URL/OPENWA_API_KEY/OPENWA_SESSION_ID)");
  }

  const res = await fetch(`${OPENWA_URL}/api/sessions/${OPENWA_SESSION_ID}/messages/send-text`, {
    method: "POST",
    headers: {
      "X-API-Key": OPENWA_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chatId: `${phone}@c.us`, text }),
  });

  if (!res.ok) {
    throw new Error(`OpenWA send-text falló: ${res.status} ${await res.text()}`);
  }
}
