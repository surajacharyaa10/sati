import { getStripe } from '../config/stripe.js';


export async function createCheckoutSession(products, orderId = null, address = '', phoneNumber = '') {
  const stripe = getStripe();
  const clientOrigin = process.env.CLIENT_ORIGIN;

  const lineItems = products.map((product) => {
    const img = product.imgdata || product.image;
    const isAbsoluteUrl =
      typeof img === 'string' &&
      (img.startsWith('http://') || img.startsWith('https://'));

    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.dish || product.name || 'Product',
          images: isAbsoluteUrl ? [img] : [],
        },
        unit_amount: Math.round(Number(product.price) * 100),
      },
      quantity: Number(product.qnty || product.quantity || 1),
    };
  });

  const successUrl = orderId
    ? `${clientOrigin}/payment-success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}&gateway=stripe`
    : `${clientOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}&gateway=stripe`;

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: 'payment',
    client_reference_id: orderId ? String(orderId) : undefined,
    metadata: {
      ...(orderId ? { orderId: String(orderId) } : {}),
      ...(address ? { address: String(address).slice(0, 500) } : {}),
      ...(phoneNumber ? { phoneNumber: String(phoneNumber).slice(0, 50) } : {}),
    },
    success_url: successUrl,
    cancel_url: `${clientOrigin}/payment-failed?reason=Payment%20was%20cancelled`,
  });

  return { id: session.id, url: session.url };
}

export async function verifyStripeSession(sessionId) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'line_items.data.price.product'],
  });
}
