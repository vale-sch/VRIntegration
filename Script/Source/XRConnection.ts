
namespace VRIntegration {
    import f = FudgeCore;



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
        //cmpCamera.mtxPivot.rotateX(90);
        // cmpCamera.mtxPivot.translateY(10);

        xrViewport.initialize("Viewport", graph, cmpCamera, canvas);
        // this.gl = this.glCanvas.getContext("webgl2");
        xrViewport.draw();


        f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
        //import change for XR SESSION
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
        checkForVRSupport();
    }

    function update(_event: Event): void {
        xrViewport.draw();
    }
    function checkForVRSupport(): void {
        navigator.xr.isSessionSupported("immersive-vr").then((supported: boolean) => {
            if (supported)
                initializeVR();
            else
                console.log("Session not supported");
        });
    }

    function initializeVR(): void {
        let enterXRButton: HTMLButtonElement = document.createElement("button");
        enterXRButton.id = "xrButton";
        enterXRButton.innerHTML = "Enter VR";
        document.body.appendChild(enterXRButton);

        enterXRButton.addEventListener("click", async function () {
            await f.Render.initializeXR("immersive-vr", "local");
            f.Loop.stop();
            f.Loop.start(f.LOOP_MODE.FRAME_REQUEST_XR);
            f.XRViewport.xrSession.addEventListener("squeeze", onSqueeze);
            f.XRViewport.xrSession.addEventListener("select", onSelect);
            f.XRViewport.xrSession.addEventListener("end", onEndSession);
            setVRRigidtransformToCamera();
        }
        );
    }
    function setVRRigidtransformToCamera(): void {
        f.XRViewport.setNewRigidtransform(cmpCamera.mtxWorld.translation);
    }
    function onSqueeze(): void {
        console.log("SQUEEZED");
        let newPos: f.Vector3 = new f.Vector3(0, 0, 5);
        f.XRViewport.setNewRigidtransform(newPos);
    }
    async function onSelect(): Promise<void> {
        let sphere: f.GraphInstance = await f.Project.createGraphInstance(<f.Graph>f.Project.resources["Graph|2022-10-26T13:26:47.063Z|65923"]);
        graph.appendChild(sphere);
    }
    function onEndSession(): void {
        f.Loop.stop();
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
    }
}

