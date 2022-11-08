
namespace VRIntegration {
    import f = FudgeCore;



    let xrViewport: f.XRViewport = new f.XRViewport();
    let graph: f.Graph = null;
    let cmpCamera: f.ComponentCamera = null;
    let rightController: f.Node = null;
    let leftController: f.Node = null;
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
        xrViewport.physicsDebugMode = f.PHYSICS_DEBUGMODE.JOINTS_AND_COLLIDER;
        xrViewport.initialize("Viewport", graph, cmpCamera, canvas);
        xrViewport.draw();
        rightController = graph.getChildrenByName("rightController")[0];
        leftController = graph.getChildrenByName("leftController")[0];

        f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);

        checkForVRSupport();
    }
    let actualHittedObject: f.Node = null;
    function update(_event: Event): void {
        rightController.getComponent(f.ComponentTransform).mtxLocal = f.XRViewport.rightController.mtxLocal;
        leftController.getComponent(f.ComponentTransform).mtxLocal = f.XRViewport.leftController.mtxLocal;

        let vecZRightCntrl: f.Vector3 = f.XRViewport.rightController.mtxLocal.getZ();
        let rayHitR = f.Physics.raycast(f.XRViewport.rightController.mtxLocal.translation, new f.Vector3(-vecZRightCntrl.x, -vecZRightCntrl.y, -vecZRightCntrl.z), 80, true);
        if (rayHitR.hit) {
            if (rayHitR.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && rayHitR.rigidbodyComponent.node.name != "New Node") {
                if (rayHitR.rigidbodyComponent.node != actualHittedObject && actualHittedObject != null)
                    actualHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualHittedObject = rayHitR.rigidbodyComponent.node;
                actualHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
            }
        }
        let vecZLeftCntrl: f.Vector3 = f.XRViewport.leftController.mtxLocal.getZ();
        let rayHitL = f.Physics.raycast(f.XRViewport.leftController.mtxLocal.translation, new f.Vector3(-vecZLeftCntrl.x, -vecZLeftCntrl.y, -vecZLeftCntrl.z), 80, true);
        if (rayHitL.hit) {
            if (rayHitL.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && rayHitL.rigidbodyComponent.node.name != "New Node") {
                if (rayHitL.rigidbodyComponent.node != actualHittedObject && actualHittedObject != null)
                    actualHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualHittedObject = rayHitL.rigidbodyComponent.node;
                actualHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
            }
        }

        f.Physics.simulate();

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
            f.XRViewport.setNewXRRigidtransform(f.Vector3.DIFFERENCE(f.Vector3.ZERO(), cmpCamera.mtxWorld.translation));
            f.Loop.start(f.LOOP_MODE.FRAME_REQUEST_XR);

            f.XRViewport.xrSession.addEventListener("squeeze", onSqueeze);
            f.XRViewport.xrSession.addEventListener("select", onSelect);
            f.XRViewport.xrSession.addEventListener("end", onEndSession);

        }
        );
    }

    function onSqueeze(): void {
        console.log("SQUEEZED");
        if (actualHittedObject != null) {
            f.XRViewport.setNewXRRigidtransform(f.Vector3.DIFFERENCE(cmpCamera.mtxWorld.translation, actualHittedObject.getComponent(f.ComponentTransform).mtxLocal.translation));
            actualHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
            actualHittedObject = null;
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

