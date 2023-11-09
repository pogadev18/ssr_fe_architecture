import type { MinimalProductInformation } from '../types/shared';

type ProductHitProps = {
  product: MinimalProductInformation;
};

const ProductHit = ({ product }: ProductHitProps) => {
  return (
    <li style={{ width: '100%', textAlign: 'center' }}>
      <div className="product-image">
        <img
          src={product.assets[0].url}
          alt={product.titleLong}
          style={{ width: '100%' }}
        />
      </div>
      <h2 style={{ fontSize: '18px' }}>{product.titleLong}</h2>
      <p style={{ fontWeight: 'bold' }}>{product.retailPriceNet_DE} EUR</p>
    </li>
  );
};

export default ProductHit;
