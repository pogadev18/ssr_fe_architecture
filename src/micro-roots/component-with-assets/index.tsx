import imgUrl from './local-component-image.jpeg' 
import './component-with-assets.css'
import svgAssetURL from './360.svg'

import { IconBeach } from '@tabler/icons-react';

export default function AComponentWithAssets () {
    return (
        <div className='container'>
            <span><IconBeach /> React SVG Icon import</span><br/>
            <span><img src={svgAssetURL} width={32} height={32}  />SVG as asset import</span><br/>
            <img className='image-with-dash' src={imgUrl} />
        </div>
    )
}
