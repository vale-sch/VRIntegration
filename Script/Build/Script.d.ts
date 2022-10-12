declare namespace VRIntegration {
}
declare namespace VRIntegration {
    class WebGLScene {
        private gl;
        private cubeRotation;
        private then;
        private time;
        private vsSource;
        private fsSource;
        private shaderProgram;
        private programInfo;
        private buffers;
        constructor(gl: WebGLRenderingContext);
        private initBuffers;
        private initShaderProgram;
        private loadShader;
        private translateAmount;
        drawScene(deltaTime: number, pose: any): void;
    }
}
declare namespace VRIntegration {
    class XRConnection {
        private gl;
        private glCanvas;
        private webGLScene;
        private then;
        constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext);
        private checkForSupport;
        private beginXRSession;
        private xrSession;
        private xrReferenceSpace;
        private onSessionStarted;
        onDrawFrame: (now: number, xrFrame: any) => void;
        private setupWebGLLayer;
        private endXRSession;
        private onSessionEnd;
    }
}
