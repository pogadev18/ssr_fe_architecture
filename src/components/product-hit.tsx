import type { MinimalProductInformation } from '../types/shared';

import styles from './product-hit.module.css';

type ProductHitProps = {
  product: MinimalProductInformation;
};

const ProductHit = ({ product }: ProductHitProps) => {
  return (
    <li className={styles.productWrapper}>
      <div>
        <img
          className={styles.productImage}
          src={product.assets[0].url}
          alt={product.titleLong}
        />
      </div>
      <h2 className={styles.productTitle}>{product.titleLong}</h2>
      <p className={styles.productPrice}>{product.retailPriceNet_DE} EUR</p>
    </li>
  );
};

export default ProductHit;
