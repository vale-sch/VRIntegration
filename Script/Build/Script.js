"use strict";
var VRIntegration;
(function (VRIntegration) {
    window.addEventListener("load", checkForSupport);
    function checkForSupport() {
        let canvas = document.querySelector("canvas");
        new VRIntegration.XRConnection(canvas, canvas.getContext("webgl"));
    }
})(VRIntegration || (VRIntegration = {}));
var VRIntegration;
(function (VRIntegration) {
    class WebGLScene {
        gl;
        constructor(gl) {
            this.gl = gl;
        }
        createScene() {
            /*========== Define and Store the Geometry ==========*/
            // Define the points in the scene
            const coordinates = [
                -0.7, 0.7,
                -0.7, 0,
                0.7, 0,
                0.7, 0.7,
                0.7, 0,
                -0.7, 0.7
            ];
            // Create an empty buffer object to store the vertex points 
            const pointsBuffer = this.gl.createBuffer();
            // Connect the empty buffer object to the GL context
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pointsBuffer);
            // Load the vertices into the GL's connected buffer
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coordinates), this.gl.STATIC_DRAW);
            /*========== Shaders ==========*/
            // Create a variable to store the data for our vertex shader
            //@ts-ignore
            const vsSource = document.querySelector("#vertex-data").text;
            //@ts-ignore
            // Create a varialble to store the data from our fragment shader
            const fsSource = document.querySelector("#fragment-data").text;
            // Compile the shaders into GLSL
            const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
            this.gl.shaderSource(vertexShader, vsSource);
            this.gl.compileShader(vertexShader);
            var success = this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS);
            if (success) {
                console.log('Vertex Shader successfully compiled.');
            }
            else {
                console.error('Vertex Shader did not compile.');
                console.log(this.gl.getShaderInfoLog(vertexShader));
            }
            const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
            this.gl.shaderSource(fragmentShader, fsSource);
            this.gl.compileShader(fragmentShader);
            success = this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS);
            if (success) {
                console.log('Fragment Shader successfully compiled.');
            }
            else {
                console.error('Fragment Shader did not compile.');
                console.log(this.gl.getShaderInfoLog(fragmentShader));
            }
            // Create a carry-out container that will pass the shader functions to the GPU
            const program = this.gl.createProgram();
            // Attach the shaders
            this.gl.attachShader(program, vertexShader);
            this.gl.attachShader(program, fragmentShader);
            // Define the active program of the GL context
            this.gl.linkProgram(program);
            this.gl.useProgram(program);
            /*===================== Connect the attribute with the vertex shader ===================*/
            // Locate the attribute from the vertex shader source in the program
            const pointsAttributeLocation = this.gl.getAttribLocation(program, "vertex_points");
            // Connect the attribute to the points data currently in the buffer object
            let size = 2; // components per iteration (2 because just x,y points)
            let type = this.gl.FLOAT; // data is 32bit floats
            let normalize = false;
            let stride = 0; // don't skip indices between coordinate pairs
            let offset = 0; // start at beginning of buffer
            this.gl.vertexAttribPointer(pointsAttributeLocation, size, type, normalize, stride, offset);
            // Send the points data to the GPU
            this.gl.enableVertexAttribArray(pointsAttributeLocation);
        }
        //@ts-ignore
        drawScene() {
            /*==================== Drawing ======================== */
            // Clear the canvas
            this.gl.clearColor(1, 1, 1, 0);
            // Clear the color buffer
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            // Draw the points on the screen
            const mode = this.gl.TRIANGLES;
            const first = 0;
            const count = 6;
            this.gl.drawArrays(mode, first, count);
            /*==================== Drawing ======================== */
        }
    }
    VRIntegration.WebGLScene = WebGLScene;
})(VRIntegration || (VRIntegration = {}));
var VRIntegration;
(function (VRIntegration) {
    class XRConnection {
        gl;
        glCanvas;
        webGLScene;
        constructor(canvas, gl) {
            this.gl = gl;
            this.glCanvas = canvas;
            this.webGLScene = new VRIntegration.WebGLScene(this.gl);
            this.checkForSupport();
        }
        checkForSupport() {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    var enterXrBtn = document.createElement("button");
                    enterXrBtn.innerHTML = "Enter VR";
                    enterXrBtn.addEventListener("click", this.beginXRSession);
                    document.body.appendChild(enterXrBtn);
                }
                else {
                    console.log("Session not supported");
                }
            });
        }
        beginXRSession = async () => {
            // requestSession must be called within a user gesture event
            // like click or touch when requesting an immersive session.
            var session = await navigator.xr.requestSession('immersive-vr');
            this.onSessionStarted(session);
        };
        xrSession = null;
        xrReferenceSpace = null;
        onSessionStarted = (session) => {
            // Store the session for use later.
            this.xrSession = session;
            //@ts-ignore
            session.requestReferenceSpace('local')
                .then((referenceSpace) => {
                this.xrReferenceSpace = referenceSpace;
            })
                .then(this.setupWebGLLayer) // Create a compatible XRWebGLLayer
                .then(() => {
                // Start the render loop
                //@ts-ignore
                this.xrSession.requestAnimationFrame(this.onDrawFrame);
                this.webGLScene.createScene();
            });
        };
        onDrawFrame = (_timestamp, xrFrame) => {
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
            }
            else {
                // No session available, so render a default mono view.
                this.gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height);
                // Request the next window callback
                //window.requestAnimationFrame(this.onDrawFrame(xrFrame, xrSession, xrReferenceSpace, glCanvas));
            }
        };
        setupWebGLLayer = async () => {
            // Make sure the canvas context we want to use is compatible with the current xr device.
            return this.gl.makeXRCompatible().then(() => {
                // The content that will be shown on the device is defined by the session's
                // baseLayer.
                this.xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(this.xrSession, this.gl) });
            });
        };
    }
    VRIntegration.XRConnection = XRConnection;
})(VRIntegration || (VRIntegration = {}));
//# sourceMappingURL=Script.js.map