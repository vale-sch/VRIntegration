namespace VRIntegration {
    export class WebGLScene {
        private gl: WebGLRenderingContext;
        constructor(gl: WebGLRenderingContext) {
            this.gl = gl;
        }
        public createScene() {
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
            const vertexShader: any = this.gl.createShader(this.gl.VERTEX_SHADER);
            this.gl.shaderSource(vertexShader, vsSource);
            this.gl.compileShader(vertexShader);
            var success = this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS);
            if (success) {
                console.log('Vertex Shader successfully compiled.');
            } else {
                console.error('Vertex Shader did not compile.');
                console.log(this.gl.getShaderInfoLog(vertexShader));
            }




            const fragmentShader: any = this.gl.createShader(this.gl.FRAGMENT_SHADER);
            this.gl.shaderSource(fragmentShader, fsSource);
            this.gl.compileShader(fragmentShader);
            success = this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS);
            if (success) {
                console.log('Fragment Shader successfully compiled.');
            } else {
                console.error('Fragment Shader did not compile.');
                console.log(this.gl.getShaderInfoLog(fragmentShader));
            }

            // Create a carry-out container that will pass the shader functions to the GPU
            const program: any = this.gl.createProgram();
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
            let size = 2;   // components per iteration (2 because just x,y points)
            let type = this.gl.FLOAT;    // data is 32bit floats
            let normalize = false;
            let stride = 0;    // don't skip indices between coordinate pairs
            let offset = 0; // start at beginning of buffer
            this.gl.vertexAttribPointer(pointsAttributeLocation, size, type,
                normalize, stride, offset);

            // Send the points data to the GPU
            this.gl.enableVertexAttribArray(pointsAttributeLocation);
        }
        public drawScene() {
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
}
