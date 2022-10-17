/// <reference types="webxr" />
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
        drawScene(deltaTime: number, then: number): void;
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
        private xrSession;
        private xrReferenceSpace;
        private beginXRSession;
        onDrawFrame: (now: number, xrFrame: XRFrame) => void;
    }
}
