import { NextApiRequest, NextApiResponse } from 'next';
import { getAllProducts } from '../../services/productService';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const products = getAllProducts();
    res.status(200).json(products);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
