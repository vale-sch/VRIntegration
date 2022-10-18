"use strict";
var VRIntegration;
(function (VRIntegration) {
    window.addEventListener("load", checkForSupport);
    function checkForSupport() {
        let canvas = document.querySelector("canvas");
        new VRIntegration.XRConnection(canvas, canvas.getContext("webgl2"));
    }
})(VRIntegration || (VRIntegration = {}));
var VRIntegration;
(function (VRIntegration) {
    class WebGLScene {
        gl;
        cubeRotation = 0.7;
        shaderProgram;
        programInfo;
        buffers;
        /*========== Shaders ==========*/
        // define shader sources
        vsSource = `
        attribute vec4 aPosition;
        attribute vec4 aVertexColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform float uTime;

        uniform float deltaTime;

        varying lowp vec4 vColor;

        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
            vColor = vec4(abs(sin(deltaTime)),0.25,abs(cos(deltaTime)),1 ); // RGB Cube
        }
    `;
        ;
        fsSource = `
        varying lowp vec4 vColor;
        
        void main() {
            gl_FragColor = vColor;
        }
    `;
        constructor(gl) {
            this.gl = gl;
            this.shaderProgram = this.initShaderProgram(this.gl, this.vsSource, this.fsSource);
            this.programInfo = {
                program: this.shaderProgram,
                attribLocations: {
                    vertexPosition: gl.getAttribLocation(this.shaderProgram, 'aPosition'),
                    vertexColor: gl.getAttribLocation(this.shaderProgram, 'aVertexColor'),
                },
                uniformLocations: {
                    deltaTime: gl.getUniformLocation(this.shaderProgram, 'deltaTime'),
                    projectionMatrix: gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
                    modelViewMatrix: gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
                }
            };
            this.buffers = this.initBuffers(this.gl);
            // Tell WebGL how to pull out the positions from the position
            // buffer into the vertexPosition attribute
            {
                const numComponents = 3;
                const type = gl.FLOAT;
                const normalize = false;
                const stride = 0;
                const offset = 0;
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
                gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
                gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
            }
            // Tell WebGL how to pull out the colors from the color buffer
            // into the vertexColor attribute.
            {
                const numComponents = 4;
                const type = gl.FLOAT;
                const normalize = false;
                const stride = 0;
                const offset = 0;
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
                gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, numComponents, type, normalize, stride, offset);
                gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
            }
        }
        initBuffers(gl) {
            // Create a buffer for the cube's vertex positions.
            const positionBuffer = gl.createBuffer();
            // Select the positionBuffer as the one to apply buffer
            // operations to from here out.
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            // Now create an array of positions for the cube.
            const positions = [
                // Front face
                0.0, 0.0, 1.0,
                1.0, 0.0, 1.0,
                1.0, 1.0, 1.0,
                0.0, 1.0, 1.0,
                // Back face
                0.0, 0.0, 0.0,
                0.0, 1.0, 0.0,
                1.0, 1.0, 0.0,
                1.0, 0.0, 0.0,
                // Top face
                0.0, 1.0, 0.0,
                0.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, 0.0,
                // Bottom face
                0.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                // Right face
                1.0, 0.0, 0.0,
                1.0, 1.0, 0.0,
                1.0, 1.0, 1.0,
                1.0, 0.0, 1.0,
                // Left face
                0.0, 0.0, 0.0,
                0.0, 0.0, 1.0,
                0.0, 1.0, 1.0,
                0.0, 1.0, 0.0,
            ];
            // Now pass the list of positions into WebGL to build the
            // shape. We do this by creating a Float32Array from the
            // JavaScript array, then use it to fill the current buffer.
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            // Now set up the colors for the faces. We'll use solid colors
            // for each face.
            const faceColors = [
                [1.0, 1.0, 1.0, 1.0],
                [1.0, 0.0, 0.0, 1.0],
                [0.0, 1.0, 0.0, 1.0],
                [0.0, 0.0, 1.0, 1.0],
                [1.0, 1.0, 0.0, 1.0],
                [1.0, 0.0, 1.0, 1.0], // Left face: purple
            ];
            // Convert the array of colors into a table for all the vertices.  
            let colors = [];
            for (var j = 0; j < faceColors.length; ++j) {
                const c = faceColors[j];
                // Repeat each color four times for the four vertices of the face
                colors = colors.concat(c, c, c, c);
            }
            const colorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            // Build the element array buffer; this specifies the indices
            // into the vertex arrays for each face's vertices.
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            // This array defines each face as two triangles, using the
            // indices into the vertex array to specify each triangle's
            // position.
            const indices = [
                0, 1, 2, 0, 2, 3,
                4, 5, 6, 4, 6, 7,
                8, 9, 10, 8, 10, 11,
                12, 13, 14, 12, 14, 15,
                16, 17, 18, 16, 18, 19,
                20, 21, 22, 20, 22, 23, // left
            ];
            // Now send the element array to GL
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
            return {
                position: positionBuffer,
                color: colorBuffer,
                indices: indexBuffer,
            };
        }
        initShaderProgram(gl, vsSource, fsSource) {
            const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
            const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
            // Create the shader program
            const shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);
            // If creating the shader program failed, alert
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
                return null;
            }
            return shaderProgram;
        }
        loadShader(gl, type, source) {
            const shader = gl.createShader(type);
            // Send the source to the shader object
            gl.shaderSource(shader, source);
            // Compile the shader program
            gl.compileShader(shader);
            // See if it compiled successfully
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }
        translateAmount = -6;
        drawScene(deltaTime, then) {
            // this.gl.clearColor(0.0, 0.0, 0.0, 0.5);  // Clear to black, fully opaque
            // this.gl.clearDepth(1.0);                 // Clear everything
            this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
            this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things
            // Clear the canvas before we start drawing on it.
            //  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            //console.log(pose);
            // Create a perspective matrix, a special matrix that is
            // used to simulate the distortion of perspective in a camera.
            // Our field of view is 45 degrees, with a width/height
            // ratio that matches the display size of the canvas
            // and we only want to see objects between 0.1 units
            // and 100 units away from the camera.
            const fieldOfView = 45 * Math.PI / 180; // in radians
            const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
            const zNear = 0.01;
            const zFar = 100.0;
            //@ts-ignore
            const projectionMatrix = mat4.create();
            // note: glmatrix.js always has the first argument
            // as the destination to receive the result.
            //@ts-ignore
            mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
            // Set the drawing position to the "identity" point, which is
            // the center of the scene.
            //@ts-ignore
            const modelViewMatrix = mat4.create();
            // Now move the drawing position a bit to where we want to
            // start drawing the square.
            if (this.translateAmount < 5)
                this.translateAmount += deltaTime * 0.3;
            else
                this.translateAmount = -6;
            //@ts-ignore
            mat4.translate(modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to translate
            [this.translateAmount, 0, -6]); // amount to translate
            //@ts-ignore
            mat4.rotate(modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to rotate
            this.cubeRotation, // amount to rotate in radians
            [0, 1, 0]);
            // Tell WebGL which indices to use to index the vertices
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
            // Tell WebGL to use our program when drawing  
            this.gl.useProgram(this.programInfo.program);
            // Set the shader uniforms  
            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
            this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
            //console.log(this.then);
            this.gl.uniform1f(this.programInfo.uniformLocations.deltaTime, then);
            {
                const vertexCount = 36;
                const type = this.gl.UNSIGNED_SHORT;
                const offset = 0;
                this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
            }
            // Update the rotation for the next draw
            this.cubeRotation += deltaTime;
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
        then = 0.0;
        enterXRButton = null;
        constructor(canvas, gl) {
            this.gl = gl;
            this.glCanvas = canvas;
            this.webGLScene = new VRIntegration.WebGLScene(this.gl);
            this.checkForSupport();
        }
        // checking for VR-capable devices
        async checkForSupport() {
            let isSupported = await navigator.xr.isSessionSupported('immersive-vr');
            if (isSupported) {
                this.enterXRButton = document.createElement("button");
                this.enterXRButton.innerHTML = "Enter VR";
                this.enterXRButton.style.position = "absolute";
                this.enterXRButton.style.display = "block";
                this.enterXRButton.style.left = "50%";
                this.enterXRButton.style.top = "50%";
                this.enterXRButton.style.transform = "translateX(-50%)";
                this.enterXRButton.style.fontSize = "100px";
                this.enterXRButton.style.backgroundColor = "blue";
                this.enterXRButton.style.color = "white";
                this.enterXRButton.style.backgroundImage = "linear-gradient(144deg, #AF40FF, #5B42F3 50%, #00DDEB)";
                this.enterXRButton.style.border = "0";
                this.enterXRButton.style.borderRadius = "8px";
                this.enterXRButton.addEventListener("click", this.beginXRSession);
                document.body.appendChild(this.enterXRButton);
            }
            else {
                console.log("Session not supported");
            }
        }
        xrSession = null;
        xrReferenceSpace = null;
        // beginXRSession must be called within a user gesture event
        // like click or touch button when requesting an immersive session.
        beginXRSession = async () => {
            let session = await navigator.xr.requestSession('immersive-vr');
            document.body.removeChild(this.enterXRButton);
            this.xrSession = session;
            this.xrReferenceSpace = await session.requestReferenceSpace('local');
            this.gl.makeXRCompatible();
            // The content that will be shown on the device is defined by the session's  baseLayer.
            this.xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(this.xrSession, this.gl) });
            // Start the render loop
            this.xrSession.requestAnimationFrame(this.onDrawFrame);
        };
        //method is called every frame 
        onDrawFrame = (_now, _xrFrame) => {
            // Do we have an active session?
            if (this.xrSession) {
                let glLayer = this.xrSession.renderState.baseLayer;
                let pose = _xrFrame.getViewerPose(this.xrReferenceSpace);
                if (pose) {
                    // Run imaginary 3D engine's simulation to step forward physics, animations, etc.
                    // scene.updateScene(timestamp, xrFrame);
                    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, glLayer.framebuffer);
                    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
                    _now *= 0.001; // convert to seconds
                    let deltaTime = 0;
                    deltaTime = _now - this.then;
                    this.then = _now;
                    for (let view of pose.views) {
                        let viewport = glLayer.getViewport(view);
                        this.gl.viewport(viewport.x, viewport.y, viewport.width * 2, viewport.height);
                        //calling the webGl Content Scene to draw 
                        this.webGLScene.drawScene(deltaTime, this.then);
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
    }
    VRIntegration.XRConnection = XRConnection;
})(VRIntegration || (VRIntegration = {}));
//# sourceMappingURL=Script.js.map