
namespace VRIntegration {
    export class XRConnection {

        private gl: WebGLRenderingContext;
        private glCanvas: HTMLCanvasElement;
        private webGLScene: WebGLScene;

        constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
            this.gl = gl;
            this.glCanvas = canvas;
            this.webGLScene = new WebGLScene(this.gl);

            this.checkForSupport();
        }
        private checkForSupport() {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    var enterXrBtn = document.createElement("button");
                    enterXrBtn.innerHTML = "Enter VR";
                    enterXrBtn.addEventListener("click", this.beginXRSession);
                    document.body.appendChild(enterXrBtn);
                } else {
                    console.log("Session not supported");
                }
            });

        }


        private beginXRSession = async (): Promise<void> => {
            // requestSession must be called within a user gesture event
            // like click or touch when requesting an immersive session.
            var session = await navigator.xr.requestSession('immersive-vr');
            this.onSessionStarted(session);



        }
        private xrSession: any = null;
        private xrReferenceSpace: any = null;

        private onSessionStarted = (session: any): void => {
            // Store the session for use later.
            this.xrSession = session;
            //@ts-ignore

            session.requestReferenceSpace('local')
                .then((referenceSpace: any) => {
                    this.xrReferenceSpace = referenceSpace;
                })
                .then(this.setupWebGLLayer) // Create a compatible XRWebGLLayer
                .then(() => {
                    // Start the render loop
                    //@ts-ignore

                    this.xrSession.requestAnimationFrame(this.onDrawFrame);
                    this.webGLScene.createScene();
                });
        }

        public onDrawFrame = (_timestamp: number, xrFrame: any): void => {
            // Do we have an active session?
            if (this.xrSession) {
                let glLayer = this.xrSession.renderState.baseLayer;
                let pose = xrFrame.getViewerPose(this.xrReferenceSpace);

                if (pose) {
                    // Run imaginary 3D engine's simulation to step forward physics, animations, etc.
                    // scene.updateScene(timestamp, xrFrame);

                    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, glLayer.framebuffer);

                    for (let view of pose.views) {
                        let viewport = glLayer.getViewport(view);
                        this.gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
                        this.webGLScene.drawScene();
                    }
                }
                // Request the next animation callback
                this.xrSession.requestAnimationFrame(this.onDrawFrame);
            } else {
                // No session available, so render a default mono view.
                this.gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height);

                // Request the next window callback
                //window.requestAnimationFrame(this.onDrawFrame(xrFrame, xrSession, xrReferenceSpace, glCanvas));
            }
        }




        private setupWebGLLayer = async (): Promise<void> => {
            // Make sure the canvas context we want to use is compatible with the current xr device.
            return this.gl.makeXRCompatible().then(() => {
                // The content that will be shown on the device is defined by the session's
                // baseLayer.
                this.xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(this.xrSession, this.gl) });
            });
        }
    }
}
