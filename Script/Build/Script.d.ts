declare namespace VRIntegration {
}
declare namespace VRIntegration {
    class WebGLScene {
        private gl;
        constructor(gl: WebGLRenderingContext);
        createScene(): void;
        drawScene(): void;
    }
}
declare namespace VRIntegration {
    class XRConnection {
        private gl;
        private glCanvas;
        private webGLScene;
        constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext);
        private checkForSupport;
        private beginXRSession;
        private xrSession;
        private xrReferenceSpace;
        private onSessionStarted;
        onDrawFrame: (_timestamp: number, xrFrame: any) => void;
        private setupWebGLLayer;
    }
}
