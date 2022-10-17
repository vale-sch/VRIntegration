
namespace VRIntegration {

    export class XRConnection {

        private gl: WebGLRenderingContext;
        private glCanvas: HTMLCanvasElement;
        private webGLScene: WebGLScene;
        private then: number = 0.0;
        private enterXRButton: HTMLButtonElement = null;


        constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
            this.gl = gl;
            this.glCanvas = canvas;
            this.webGLScene = new WebGLScene(this.gl);

            this.checkForSupport();
        }


        // checking for VR-capable devices
        private checkForSupport() {
            navigator.xr.isSessionSupported('immersive-vr').then((supported: any) => {
                if (supported) {
                    this.enterXRButton = document.createElement("button");
                    this.enterXRButton.innerHTML = "Enter VR";
                    this.enterXRButton.style.position = "absolute";
                    this.enterXRButton.style.left = "35%";
                    this.enterXRButton.style.top = "40%";
                    this.enterXRButton.style.fontSize = "200px";
                    this.enterXRButton.addEventListener("click", this.beginXRSession);
                    document.body.appendChild(this.enterXRButton);
                } else {
                    console.log("Session not supported");
                }
            });
        }

        private xrSession: XRSession = null;
        private xrReferenceSpace: XRReferenceSpace = null;

        // beginXRSession must be called within a user gesture event
        // like click or touch button when requesting an immersive session.
        private beginXRSession = async (): Promise<void> => {
            let session: XRSession = await navigator.xr.requestSession('immersive-vr');
            document.body.removeChild(this.enterXRButton);
            this.xrSession = session;
            await session.requestReferenceSpace('local')
                .then((referenceSpace: XRReferenceSpace) => {
                    this.xrReferenceSpace = referenceSpace;
                })
            this.gl.makeXRCompatible().then(() => {
                // The content that will be shown on the device is defined by the session's  baseLayer.
                this.xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(this.xrSession, this.gl) });
            });
            // Start the render loop
            this.xrSession.requestAnimationFrame(this.onDrawFrame);

        }

        //method is called every frame 
        public onDrawFrame = (now: number, xrFrame: XRFrame): void => {
            // Do we have an active session?
            if (this.xrSession) {
                let glLayer = this.xrSession.renderState.baseLayer;
                let pose = xrFrame.getViewerPose(this.xrReferenceSpace);
                console.log(xrFrame);
                if (pose) {
                    // Run imaginary 3D engine's simulation to step forward physics, animations, etc.
                    // scene.updateScene(timestamp, xrFrame);

                    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, glLayer.framebuffer);
                    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

                    now *= 0.001;  // convert to seconds
                    let deltaTime = 0;
                    deltaTime = now - this.then;
                    this.then = now;

                    for (let view of pose.views) {
                        let viewport = glLayer.getViewport(view);
                        this.gl.viewport(viewport.x, viewport.y, viewport.width * 2, viewport.height);
                        //calling the webGl Content Scene to draw 
                        this.webGLScene.drawScene(deltaTime, this.then);

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


        /* //call this method if you want to end the immersive session
         private endXRSession(): void {
             // Do we have an active session?
             if (this.xrSession) {
                 // End the XR session now.
                 this.xrSession.end().then(this.onSessionEnd);
             }
         }
 
         // Restore the page to normal after an immersive session has ended.
         private onSessionEnd() {
             this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
 
             this.xrSession = null;
 
             // Ending the session stops executing callbacks passed to the XRSession's
             // requestAnimationFrame(). To continue rendering, use the window's
             // requestAnimationFrame() function.
             // window.requestAnimationFrame(onDrawFrame);
         }*/
    }
}
