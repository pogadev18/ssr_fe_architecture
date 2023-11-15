declare module 'nodesi' {
    export default class ESI {
        constructor(options: { baseUrl: string, onError: (src: string, error: any) => string });
        process(input: string): Promise<string>;
    }
}
