declare namespace VRIntegration {
    import f = FudgeCore;
    class CustomComponentScript extends f.ComponentScript {
        static readonly iSubclass: number;
        message: string;
        constructor();
        hndEvent: (_event: Event) => void;
        private update;
    }
}
declare namespace VRIntegration {
}
declare namespace VRIntegration {
    class XRConnection {
        private gl;
        private glCanvas;
        private then;
        private viewport;
        constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext);
        private init;
        private update;
    }
}
