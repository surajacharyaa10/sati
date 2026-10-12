import { getStripe } from '../config/stripe.js';

export async function createCheckoutSession(products) {
  const stripe = getStripe();
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

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
        unit_amount: Math.round(Number(product.price) * 100), // dollars → cents
      },
      quantity: Number(product.qnty || product.quantity || 1),
    };
  });

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: 'payment',
    success_url: `${clientOrigin}/sucess`,
    cancel_url: `${clientOrigin}/cancel`,
  });

  return { id: session.id, url: session.url };
}
