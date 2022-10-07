var f = FudgeCore;
window.addEventListener("load", init);
let viewport = null;
let cmpCamera = null;
async function init() {
    await FudgeCore.Project.loadResources("Internal.json");
    FudgeCore.Debug.log("Project:", FudgeCore.Project.resources);
    let madeMazeGraph = f.Project.resources[document.head.querySelector("meta[autoView]").getAttribute("autoView")];

    FudgeCore.Debug.log("Graph:", madeMazeGraph);
    if (!madeMazeGraph) {
        alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
        return;
    }

    // setup the viewport
    cmpCamera = new f.ComponentCamera();
    let canvas = document.querySelector("canvas");
    viewport = new f.Viewport();
    viewport.initialize("InteractiveViewport", madeMazeGraph, cmpCamera, canvas);






    // viewport.draw();
    // f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    //  f.Loop.start();
}

function update(_event) {
    viewport.draw();
}


navigator.xr.addEventListener('devicechange', checkForXRSupport);
checkForXRSupport();
async function checkForXRSupport() {
    // Check to see if there is an XR device available that supports immersive VR
    // presentation (for example: displaying in a headset). If the device has that
    // capability the page will want to add an "Enter VR" button to the page (similar to
    // a "Fullscreen" button) that starts the display of immersive VR content.
    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if (supported) {
            var enterXrBtn = document.createElement("button");
            enterXrBtn.innerHTML = "Enter VR";
            enterXrBtn.addEventListener("click", beginXRSession);
            document.body.appendChild(enterXrBtn);
        } else {
            console.log("Session not supported: " + reason);
        }
    });
}
function beginXRSession() {
    // requestSession must be called within a user gesture event
    // like click or touch when requesting an immersive session.
    navigator.xr.requestSession('immersive-vr')
        .then(onSessionStarted)
        .catch(err => {
            // May fail for a variety of reasons. Probably just want to
            // render the scene normally without any tracking at this point.
            console.log(err);
        });
}
let xrSession = null;
let xrReferenceSpace = null;

function onSessionStarted(session) {
    // Store the session for use later.
    xrSession = session;

    xrSession.requestReferenceSpace('local')
        .then((referenceSpace) => {
            xrReferenceSpace = referenceSpace;
        })
        .then(setupWebGLLayer) // Create a compatible XRWebGLLayer
        .then(() => {
            // Start the render loop
            xrSession.requestAnimationFrame(onDrawFrame);
        });
}
let glCanvas = document.querySelector("canvas");
let gl = glCanvas.getContext("webgl");
//loadSceneGraphics(gl);

function setupWebGLLayer() {
    // Make sure the canvas context we want to use is compatible with the current xr device.
    return gl.makeXRCompatible().then(() => {
        // The content that will be shown on the device is defined by the session's
        // baseLayer.
        xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(xrSession, gl) });
    });
}
function onDrawFrame(timestamp, xrFrame) {
    // Do we have an active session?
    if (xrSession) {
        let glLayer = xrSession.renderState.baseLayer;
        let pose = xrFrame.getViewerPose(xrReferenceSpace);
        if (pose) {
            // Run imaginary 3D engine's simulation to step forward physics, animations, etc.
            // viewport.draw();

            gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);

            for (let view of pose.views) {
                let viewport = glLayer.getViewport(view);
                gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
                drawScene(view);
            }
        }
        // Request the next animation callback
        xrSession.requestAnimationFrame(onDrawFrame);
    } else {
        // No session available, so render a default mono view.
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
        drawSceneFromDefaultView();

        // Request the next window callback
        window.requestAnimationFrame(onDrawFrame);
    }
}
function drawScene(view) {
    /* cmpCamera.mtxLocal.position = new f.Vector3(
         view.transform.position.x,
         view.transform.position.y,
         view.transform.position.z,
     );
 
     cmpCamera.setOrientationQuaternion(
         view.transform.orientation.x,
         view.transform.orientation.y,
         view.transform.orientation.z,
         view.transform.orientation.w,
     );
 
     cmpCamera.setProjectionMatrix4x4(
         view.projectionMatrix[0],
         view.projectionMatrix[1],
         //...
         view.projectionMatrix[14],
         view.projectionMatrix[15]
     );
 
     scene.renderWithCamera(camera);*/
    //  console.log("JO");
}
