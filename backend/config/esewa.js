import { createHmac } from 'node:crypto';


/**
 * Generates a secure HMAC-SHA256 hash to initiate an eSewa payment request.
 * @param {{ amount: number, transaction_uuid: string }} params
 * @returns {{ signature: string, signed_field_names: string }}
 */
export async function getEsewaPaymentHash({ amount, transaction_uuid }) {
  const data = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE}`;
  const hash = createHmac('sha256', process.env.ESEWA_SECRET_KEY)
    .update(data)
    .digest('base64');

  return {
    signature: hash,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
  };
}

/**
 * Decodes and verifies the Base64 response from eSewa after a transaction.
 * Throws if the signature is invalid or the transaction is not COMPLETE.
 * @param {string} encodedData - Base64 string received from eSewa redirect
 * @returns {{ response: object, decodedData: object }}
 */
export async function verifyEsewaPayment(encodedData) {
  const decodedData = JSON.parse(atob(encodedData));

  const data = `transaction_code=${decodedData.transaction_code},status=${decodedData.status},total_amount=${decodedData.total_amount},transaction_uuid=${decodedData.transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE},signed_field_names=${decodedData.signed_field_names}`;

  const hash = createHmac('sha256', process.env.ESEWA_SECRET_KEY)
    .update(data)
    .digest('base64');

  if (hash !== decodedData.signature) {
    throw new Error('eSewa signature mismatch — payment data may have been tampered with');
  }

  const url = `${process.env.ESEWA_GATEWAY_URL}/api/epay/transaction/status/?product_code=${process.env.ESEWA_PRODUCT_CODE}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  });

  const responseData = await res.json();

  if (
    responseData.status !== 'COMPLETE' ||
    responseData.transaction_uuid !== decodedData.transaction_uuid ||
    Number(responseData.total_amount) !== Number(decodedData.total_amount)
  ) {
    throw new Error('eSewa payment verification failed');
  }

  return { response: responseData, decodedData };
}
