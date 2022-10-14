declare namespace VRIntegration {
}
declare namespace VRIntegration {
    class WebGLScene {
        private gl;
        private cubeRotation;
        private shaderProgram;
        private programInfo;
        private buffers;
        private vsSource;
        private fsSource;
        constructor(gl: WebGLRenderingContext);
        private initBuffers;
        private initShaderProgram;
        private loadShader;
        private translateAmount;
        drawScene(deltaTime: number, then: number, pose: any): void;
    }
}
declare namespace VRIntegration {
    class XRConnection {
        private gl;
        private glCanvas;
        private webGLScene;
        private then;
        private enterXRButton;
        constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext);
        private checkForSupport;
        private beginXRSession;
        private xrSession;
        private xrReferenceSpace;
        private onSessionStarted;
        private setupWebGLLayer;
        onDrawFrame: (now: number, xrFrame: any) => void;
        private endXRSession;
        private onSessionEnd;
    }
}
