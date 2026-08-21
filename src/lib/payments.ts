// Ödeme sağlayıcı adapter'ı (CLAUDE.md #8): MVP tek sağlayıcıya bağlanmaz.
// Gerçek entegrasyon (iyzico, PayTR vb.) bu arayüzü uygulayarak eklenir.

export interface ChargeRequest {
  amount: number;
  currency: string;
  description: string;
}

export interface ChargeResult {
  success: boolean;
  reference: string;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  charge(req: ChargeRequest): Promise<ChargeResult>;
}

// MVP: kart ödemesini benzetimle onaylayan mock sağlayıcı.
export class MockCardProvider implements PaymentProvider {
  name = "mock-card";

  async charge(req: ChargeRequest): Promise<ChargeResult> {
    if (req.amount <= 0) return { success: false, reference: "", error: "Geçersiz tutar" };
    return { success: true, reference: `MOCK-${Math.random().toString(36).slice(2, 10).toUpperCase()}` };
  }
}

export function getCardProvider(): PaymentProvider {
  return new MockCardProvider();
}

export const TRANSFER_INSTRUCTIONS = {
  bank: "Örnek Banka",
  iban: "TR00 0000 0000 0000 0000 0000 00",
  holder: "tasinmakistiyorum.com",
  note: "Açıklamaya takip kodunuzu yazınız.",
};
