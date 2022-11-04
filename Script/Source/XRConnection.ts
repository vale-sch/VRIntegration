
namespace VRIntegration {
    import f = FudgeCore;



    let xrViewport: f.XRViewport = new f.XRViewport();
    let graph: f.Graph = null;
    let cmpCamera: f.ComponentCamera = null;
    let rayHit: f.RayHitInfo = null;
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
    let oldHittedObject: f.Node = null;
    function update(_event: Event): void {
        f.Physics.simulate();

        f.Physics.draw(cmpCamera, f.PHYSICS_DEBUGMODE.JOINTS_AND_COLLIDER);
        f.Physics.debugDraw.setDebugMode(f.PHYSICS_DEBUGMODE.JOINTS_AND_COLLIDER);

        let vecZ: f.Vector3 = cmpCamera.mtxWorld.getZ();
        rayHit = f.Physics.raycast(cmpCamera.mtxWorld.translation, new f.Vector3(-vecZ.x, -vecZ.y, -vecZ.z), 80, true);
        f.Physics.debugDraw.debugRay(rayHit.rayOrigin, rayHit.rayEnd, new f.Color(1, 0, 0, 1));
        if (rayHit.hit) {
            if (rayHit.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC) {
                if (rayHit.rigidbodyComponent.node != oldHittedObject && oldHittedObject != null)
                    oldHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                oldHittedObject = rayHit.rigidbodyComponent.node;
                oldHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
            }
        }
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
        if (oldHittedObject != null) {
            f.XRViewport.setXRRigidtransform(oldHittedObject.getComponent(f.ComponentTransform).mtxLocal);
            oldHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
            oldHittedObject = null;
        }
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

