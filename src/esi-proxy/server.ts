import express from 'express'
import httpProxy from 'express-http-proxy'
import ESI from 'nodesi'

const esiServer = express()
const port = 3000
const esi = new ESI({
    baseUrl: 'http://localhost:3001',
    onError: function(src, error) {
        if(error.statusCode === 404) {
            return `${src} was not found`;
        }
        return '';
    }
})

esiServer.use('/', httpProxy('http://localhost:3001', {
    userResDecorator: async (proxyRes, proxyResData, userReq, userRes) => {
        try {
            if ( proxyRes.headers['content-type']?.startsWith('text/html') ) {
                return esi.process(proxyResData.toString())
            }
            return proxyResData
        } catch (err) {
            console.error(err)
            return proxyResData
        }
    }
}))


esiServer.listen(port, () => {
    console.log("ESI server operationl on", port)
})