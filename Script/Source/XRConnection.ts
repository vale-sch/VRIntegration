
namespace VRIntegration {
    export class XRConnection {

        private gl: WebGLRenderingContext;
        private glCanvas: HTMLCanvasElement;
        private webGLScene: WebGLScene;
        private then: number = 0.0;



        constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
            this.gl = gl;
            this.glCanvas = canvas;
            this.webGLScene = new WebGLScene(this.gl);

            this.checkForSupport();
        }


        // checking for VR-capable devices
        private checkForSupport() {
            //@ts-ignore
            navigator.xr.isSessionSupported('immersive-vr').then((supported: any) => {
                if (supported) {
                    var enterXrBtn = document.createElement("button");
                    enterXrBtn.innerHTML = "Enter VR";
                    enterXrBtn.style.position = "absolute";
                    enterXrBtn.style.left = "35%";
                    enterXrBtn.style.top = "40%";
                    enterXrBtn.style.fontSize = "200px";
                    enterXrBtn.addEventListener("click", this.beginXRSession);
                    document.body.appendChild(enterXrBtn);
                } else {
                    console.log("Session not supported");
                }
            });
        }



        // beginXRSession must be called within a user gesture event
        // like click or touch button when requesting an immersive session.
        private beginXRSession = async (): Promise<void> => {
            //@ts-ignore
            var session = await navigator.xr.requestSession('immersive-vr');
            this.onSessionStarted(session);
        }



        private xrSession: any = null;
        private xrReferenceSpace: any = null;
        private onSessionStarted = (session: any): void => {
            // Store the session for use later.
            this.xrSession = session;
            session.requestReferenceSpace('local')
                .then((referenceSpace: any) => {
                    this.xrReferenceSpace = referenceSpace;
                })
                .then(this.setupWebGLLayer) // Create a compatible XRWebGLLayer
                .then(() => {
                    // Start the render loop
                    this.xrSession.requestAnimationFrame(this.onDrawFrame);
                });
        }



        //making the session immersive 
        private setupWebGLLayer = async (): Promise<void> => {
            // Make sure the canvas context we want to use is compatible with the current xr device.
            //@ts-ignore
            return this.gl.makeXRCompatible().then(() => {
                // The content that will be shown on the device is defined by the session's  baseLayer.
                //@ts-ignore
                this.xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(this.xrSession, this.gl) });
            });
        }



        //this method is called every frame 
        public onDrawFrame = (now: number, xrFrame: any): void => {
            // Do we have an active session?
            if (this.xrSession) {
                let glLayer = this.xrSession.renderState.baseLayer;
                let pose = xrFrame.getViewerPose(this.xrReferenceSpace);

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
                        console.log(viewport);
                        this.gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
                        //calling the webGl Content Scene to draw 
                        this.webGLScene.drawScene(deltaTime, this.then, pose);

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


        //call this method if you want to end the immersive session
        //@ts-ignore
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
        }
    }
}
