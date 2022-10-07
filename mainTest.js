





//--------------------------------------WEBXR-----------------------------------------------------

import { WebXRButton } from "./webxr-button.js";
import { Renderer, createWebGLContext } from './renderer.js';
import { Scene } from './scene.js';
import { SkyboxNode } from './skybox.js';

let xrButton = null;
let xrRefSpace = null;

let gl = null;
let scene = new Scene();

let renderer = null;

scene.addNode(new SkyboxNode({ url: 'fudgelogo.png' }));
function initXR() {

    // Adds a helper button to the page that indicates if any XRDevices are
    // available and let's the user pick between them if there's multiple.
    xrButton = new WebXRButton({
        onRequestSession: onRequestSession,
        onEndSession: onEndSession
    });
    document.querySelector('header').appendChild(xrButton.domElement);
    // Is WebXR available on this UA?

    if (navigator.xr) {
        // If the device allows creation of exclusive sessions set it as the
        // target of the 'Enter XR' button.
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            xrButton.enabled = supported;
        });
    }

}





function onRequestSession() {
    return navigator.xr.requestSession('immersive-vr').then(onSessionStarted);
}




function onSessionStarted(session) {
    // This informs the 'Enter XR' button that the session has started and
    // that it should display 'Exit XR' instead.
    xrButton.setSession(session);

    // Listen for the sessions 'end' event so we can respond if the user
    // or UA ends the session for any reason.
    session.addEventListener('end', onSessionEnded);

    // Create a WebGL context to render with, initialized to be compatible
    // with the XRDisplay we're presenting to.
    gl = createWebGLContext({
        xrCompatible: true
    });

    // Create a renderer with that GL context (this is just for the samples
    // framework and has nothing to do with WebXR specifically.)
    renderer = new Renderer(gl);
    // Set the scene's renderer, which creates the necessary GPU resources.
    scene.setRenderer(renderer);

    // Use the new WebGL context to create a XRWebGLLayer and set it as the
    // sessions baseLayer. This allows any content rendered to the layer to
    // be displayed on the XRDevice.
    session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });

    // Get a frame of reference, which is required for querying poses. In
    // this case an 'local' frame of reference means that all poses will
    // be relative to the location where the XRDevice was first detected.
    session.requestReferenceSpace('local').then((refSpace) => {
        xrRefSpace = refSpace;

        // Inform the session that we're ready to begin drawing.
        session.requestAnimationFrame(onXRFrame);
    });
    console.log(scene);
}




function onEndSession(session) {
    session.end();
}

function onSessionEnded(event) {
    xrButton.setSession(null);

    // In this simple case discard the WebGL context too, since we're not
    // rendering anything else to the screen with it.
    renderer = null;
}





function onXRFrame(t, frame) {
    let session = frame.session;

    // Per-frame scene setup. Nothing WebXR specific here.
    scene.startFrame();

    // Inform the session that we're ready for the next frame.
    session.requestAnimationFrame(onXRFrame);

    // Get the XRDevice pose relative to the Frame of Reference we created
    // earlier.
    let pose = frame.getViewerPose(xrRefSpace);

    // Getting the pose may fail if, for example, tracking is lost. So we
    // have to check to make sure that we got a valid pose before attempting
    // to render with it. If not in this case we'll just leave the
    // framebuffer cleared, so tracking loss means the scene will simply
    // disappear.
    if (pose) {
        let glLayer = session.renderState.baseLayer;

        // If we do have a valid pose, bind the WebGL layer's framebuffer,
        // which is where any content to be displayed on the XRDevice must be
        // rendered.
        gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);

        // Clear the framebuffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Loop through each of the views reported by the frame and draw them
        // into the corresponding viewport.
        for (let view of pose.views) {
            let viewport = glLayer.getViewport(view);
            gl.viewport(viewport.x, viewport.y,
                viewport.width, viewport.height);

            // Draw this view of the scene. What happens in this function really
            // isn't all that important. What is important is that it renders
            // into the XRWebGLLayer's framebuffer, using the viewport into that
            // framebuffer reported by the current view, and using the
            // projection matrix and view transform from the current view.
            // We bound the framebuffer and viewport up above, and are passing
            // in the appropriate matrices here to be used when rendering.
            scene.draw(view.projectionMatrix, view.transform);
        }
    } else {
        // There's several options for handling cases where no pose is given.
        // The simplest, which these samples opt for, is to simply not draw
        // anything. That way the device will continue to show the last frame
        // drawn, possibly even with reprojection. Alternately you could
        // re-draw the scene again with the last known good pose (which is now
        // likely to be wrong), clear to black, or draw a head-locked message
        // for the user indicating that they should try to get back to an area
        // with better tracking. In all cases it's possible that the device
        // may override what is drawn here to show the user it's own error
        // message, so it should not be anything critical to the application's
        // use.
    }

    // Per-frame scene teardown. Nothing WebXR specific here.
    scene.endFrame();
}
initXR();
//--------------------------------------WEBXR-----------------------------------------------------








//--------------------------------------FUDGE-----------------------------------------------------
var f = FudgeCore;
var ƒAid = FudgeAid;
let graphId = document.head.querySelector("meta[autoView]").getAttribute("autoView")

window.addEventListener("load", startInteractiveViewport(graphId));
let cmpCamera = null;
let canvas = null;
let viewport = null;
// show dialog for startup, user interaction required e.g. for starting audio
let graph = null;

// setup and start interactive viewport
async function startInteractiveViewport(_graphId) {
    // load resources referenced in the link-tag
    await f.Project.loadResourcesFromHTML();
    f.Debug.log("Project:", f.Project.resources);

    // get the graph to show from loaded resources
    graph = f.Project.resources[_graphId];
    f.Debug.log("Graph:", graph);
    if (!graph) {
        alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
        return;
    }

    // setup the viewport
    cmpCamera = new f.ComponentCamera();
    canvas = document.querySelector("canvas");
    viewport = new f.Viewport();
    viewport.initialize("InteractiveViewport", graph, cmpCamera, canvas);
    f.Debug.log("Viewport:", viewport);
    // make the camera interactive (complex method in FudgeAid)
    let cameraOrbit = ƒAid.Viewport.expandCameraToInteractiveOrbit(viewport);

    // hide the cursor when interacting, also suppressing right-click menu
    canvas.addEventListener("mousedown", canvas.requestPointerLock);
    canvas.addEventListener("mouseup", function () { document.exitPointerLock(); });

    // setup audio
    let cmpListener = new f.ComponentAudioListener();
    cmpCamera.node.addComponent(cmpListener);
    f.AudioManager.default.listenWith(cmpListener);
    f.AudioManager.default.listenTo(graph);
    f.Debug.log("Audio:", f.AudioManager.default);

    // draw viewport once for immediate feedback
    f.Render.prepare(cameraOrbit);
    viewport.draw();
    let node = new f.Node();
    console.log(node);
    // dispatch event to signal startup done
    canvas.dispatchEvent(new CustomEvent("interactiveViewportStarted", { bubbles: true, detail: viewport }));
}
/*--------------------------------------FUDGE-----------------------------------------------------


*/

















