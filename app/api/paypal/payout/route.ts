const PAYPAL_CLIENT_ID = 'AbRcG86L6wOjY2mEanYbcFfcBZ_-b2QYrKq3o_b33nuPhkobvXQ_s8ZNR0UQp2cg3Bs4KPJk-bT3hLG4';
const PAYPAL_CLIENT_SECRET = 'EC3gKCmK0KLCkLVC1-0-1wvXpo_A1SzEsezVURWSYeQ8CZ_65cwzk3eLbxMu9Bg8IXvZ6VRPOJb_mw0f';
const PAYPAL_BASE_URL = 'https://api-m.paypal.com';

const RECIPIENTS: Record<string, string> = {
  luke: 'lukeianestesalona@gmail.com',
  richard: 'rjosephporter@gmail.com',
  jerome: 'jeromeabamjr@icloud.com',
};

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal OAuth failed: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipient, amount } = body as { recipient: string; amount: number };

    // Validate inputs
    if (!recipient || !amount) {
      return Response.json(
        { error: 'Missing required fields: recipient and amount' },
        { status: 400 }
      );
    }

    const recipientKey = recipient.toLowerCase();
    const email = RECIPIENTS[recipientKey];
    if (!email) {
      return Response.json(
        { error: `Unknown recipient: ${recipient}. Valid: ${Object.keys(RECIPIENTS).join(', ')}` },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0 || amount > 10000) {
      return Response.json(
        { error: 'Amount must be between $0.01 and $10,000' },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getAccessToken();

    // Create payout
    const senderBatchId = `mc_payout_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const payoutRes = await fetch(`${PAYPAL_BASE_URL}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: senderBatchId,
          email_subject: 'Mission Control Payment',
          email_message: 'You have received a payment from Mission Control.',
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: amount.toFixed(2),
              currency: 'USD',
            },
            receiver: email,
            note: `Payment to ${recipient} via Mission Control`,
            sender_item_id: `item_${Date.now()}`,
          },
        ],
      }),
    });

    if (!payoutRes.ok) {
      const err = await payoutRes.json().catch(() => ({}));
      console.error('PayPal Payout error:', err);
      return Response.json(
        {
          error: `PayPal payout failed: ${(err as Record<string, string>).message || payoutRes.statusText}`,
          details: err,
        },
        { status: payoutRes.status }
      );
    }

    const payoutData = await payoutRes.json();
    const batchId = payoutData.batch_header?.payout_batch_id || senderBatchId;
    const batchStatus = payoutData.batch_header?.batch_status || 'PENDING';

    return Response.json({
      success: true,
      batch_id: batchId,
      status: batchStatus,
      recipient: recipient,
      email: email,
      amount: amount,
    });
  } catch (error) {
    console.error('Payout API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
