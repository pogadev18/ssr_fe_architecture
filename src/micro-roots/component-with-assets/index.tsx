import imgUrl from './local-component-image.jpeg' 
import './component-with-assets.css'
import svgAssetURL from './360.svg'

import { IconBeach } from '@tabler/icons-react';
import styles from './test.module.css'

export const TEST = 1

export default function AComponentWithAssets () {
    return (
        <div className={styles.container}>
            <span><IconBeach /> React SVG Icon import</span><br/>
            <span><img src={svgAssetURL} width={32} height={32}  />SVG as asset import</span><br/>
            <img className='image-with-dash' src={imgUrl} />
            <button onClick={() => {
                console.log("clicked")
            }}>Test interaction</button>
        </div>
    )
}
