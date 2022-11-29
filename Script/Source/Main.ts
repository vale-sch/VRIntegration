namespace Script {
  import f = FudgeCore;
  f.Debug.info("Main Program Template running!");

  let xrViewport: f.XRViewport = new f.XRViewport();
  let graph: f.Graph = null;
  let cmpCamera: f.ComponentCamera = null;
  window.addEventListener("load", init);

  async function init() {
    await FudgeCore.Project.loadResources("Internal.json");
    graph = <f.Graph>f.Project.resources[document.head.querySelector("meta[autoView]").getAttribute("autoView")];
    FudgeCore.Debug.log("Graph:", graph);
    if (!graph) {
      alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
      return;
    }
    let canvas: HTMLCanvasElement = <HTMLCanvasElement>document.querySelector("canvas");
    cmpCamera = graph.getChildrenByName("Camera")[0].getComponent(f.ComponentCamera);

    xrViewport.initialize("Viewport", graph, cmpCamera, canvas);


    xrViewport.draw();
    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
    f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);

    checkForVRSupport();
  }
  // check device/browser capabilities for XR Session 
  function checkForVRSupport(): void {
    navigator.xr.isSessionSupported("immersive-vr").then((supported: boolean) => {
      if (supported)
        initializeVR();
      else
        console.log("Session not supported");
    });
  }
  //main function to start XR Session
  function initializeVR(): void {
    //create XR Button -> Browser 
    let enterXRButton: HTMLButtonElement = document.createElement("button");
    enterXRButton.id = "xrButton";
    enterXRButton.innerHTML = "Enter VR";
    document.body.appendChild(enterXRButton);

    enterXRButton.addEventListener("click", async function () {
      //initalizes xr session 
      await xrViewport.initializeXR("immersive-vr", "local", false);

      //stop normal loop of winodws.animationFrame
      f.Loop.stop();
      //set xr transform to matrix from ComponentCamera -> xr transform = camera transform
      xrViewport.xr.setNewXRRigidtransform(f.Vector3.DIFFERENCE(f.Vector3.ZERO(), cmpCamera.mtxWorld.translation));
      //start xrSession.animationFrame instead of window.animationFrame, your xr-session is ready to go!
      f.Loop.start(f.LOOP_MODE.FRAME_REQUEST_XR);
    }
    );
  }
  function update(_event: Event): void {
    // ƒ.Physics.simulate();  // if physics is included and used
    xrViewport.draw();
    // f.AudioManager.default.update();
  }
}