import Stripe from 'stripe';


let stripeClient = null;

/**
 * Returns the singleton Stripe client.
 * Reads STRIPE_SECRET from .env (set it to your sk_test_... key).
 */
export const getStripe = () => {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET;
  if (!secretKey || secretKey === '') {
    throw new Error('STRIPE_SECRET is missing in .env');
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
};
