
namespace VRIntegration {
    import f = FudgeCore;



    let xrViewport: f.XRViewport = new f.XRViewport();
    let graph: f.Graph = null;
    let cmpCamera: f.ComponentCamera = null;
    let ray: f.Ray = null;
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
        ray = new f.Ray(f.Vector3.Z(1), f.Vector3.Y(1), 500);
        f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
        checkForVRSupport();
    }

    function update(_event: Event): void {
        let picks: f.Pick[] = f.Picker.pickRay(graph.getChildrenByName("FudgeLogo")[0].getChildren(), ray, 0.1, 15);

        console.log(picks);

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

            f.XRViewport.setXRRigidtransform(cmpCamera.mtxWorld);
        }
        );
    }

    function onSqueeze(): void {
        console.log("SQUEEZED");
        // let newPos: f.Vector3 = new f.Vector3(0, 0, 5);
        // f.XRViewport.setNewRigidtransform(newPos);
    }
    async function onSelect(): Promise<void> {
        let sphere: f.GraphInstance = await f.Project.createGraphInstance(<f.Graph>f.Project.resources["Graph|2022-10-26T13:26:47.063Z|65923"]);
        graph.appendChild(sphere);
        f.XRViewport.setXRRigidtransform(sphere.getChild(0).mtxLocal);

    }
    function onEndSession(): void {
        f.Loop.stop();
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
    }
}

