
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
        setupAudio();

        xrViewport.physicsDebugMode = f.PHYSICS_DEBUGMODE.JOINTS_AND_COLLIDER;
        xrViewport.initialize("Viewport", graph, cmpCamera, canvas);
        rightController = graph.getChildrenByName("rightController")[0];
        leftController = graph.getChildrenByName("leftController")[0];

        xrViewport.draw();
        f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);

        checkForVRSupport();
    }

    function setupAudio(): void {
        let cmpListener: f.ComponentAudioListener = new f.ComponentAudioListener();
        cmpCamera.node.addComponent(cmpListener);
        f.AudioManager.default.listenTo(graph);
        f.AudioManager.default.listenWith(cmpCamera.node.getComponent(f.ComponentAudioListener));
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
            f.XRViewport.xrSession.addEventListener("selectstart", onSelectStart);
            f.XRViewport.xrSession.addEventListener("selectend", onSelectEnd);
            f.XRViewport.xrSession.addEventListener("end", onEndSession);
        }
        );
    }






    let actualTeleportationObj: f.Node = null;
    let actualThrowObject: f.Node = null;
    let selectPressedRight: boolean = false;
    let selectPressedLeft: boolean = false;
    let hasHitThisFrameTeleObj: boolean = false;

    function update(_event: Event): void {

        hasHitThisFrameTeleObj = false;
        rightController.getComponent(f.ComponentTransform).mtxLocal = f.XRViewport.rightController.mtxLocal;
        leftController.getComponent(f.ComponentTransform).mtxLocal = f.XRViewport.leftController.mtxLocal;


        let vecZRightCntrl: f.Vector3 = f.XRViewport.rightController.mtxLocal.getZ();
        let rayHitR = f.Physics.raycast(f.XRViewport.rightController.mtxLocal.translation, new f.Vector3(-vecZRightCntrl.x, -vecZRightCntrl.y, -vecZRightCntrl.z), 80, true);
        if (rayHitR)
            if (rayHitR.hit) {
                if (rayHitR.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && rayHitR.rigidbodyComponent.node.name != "New Node") {
                    hasHitThisFrameTeleObj = true;
                    actualTeleportationObj = rayHitR.rigidbodyComponent.node;
                    actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                }
                if (rayHitR.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && rayHitR.rigidbodyComponent.node.name == "New Node") {
                    if (rayHitR.rigidbodyComponent.node != actualThrowObject && actualThrowObject != null)
                        actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                    actualThrowObject = rayHitR.rigidbodyComponent.node;
                    actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                }
            }



        let vecZLeftCntrl: f.Vector3 = f.XRViewport.leftController.mtxLocal.getZ();
        let rayHitL = f.Physics.raycast(f.XRViewport.leftController.mtxLocal.translation, new f.Vector3(-vecZLeftCntrl.x, -vecZLeftCntrl.y, -vecZLeftCntrl.z), 80, true);
        if (rayHitL)
            if (rayHitL.hit) {
                if (rayHitL.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && rayHitL.rigidbodyComponent.node.name != "New Node") {
                    hasHitThisFrameTeleObj = true;
                    actualTeleportationObj = rayHitL.rigidbodyComponent.node;
                    actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                }
                if (rayHitL.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && rayHitL.rigidbodyComponent.node.name == "New Node") {
                    if (rayHitL.rigidbodyComponent.node != actualThrowObject && actualThrowObject != null)
                        actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                    actualThrowObject = rayHitL.rigidbodyComponent.node;
                    actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 1;

                }
            }


        if (!hasHitThisFrameTeleObj && actualTeleportationObj != null) {
            actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
            actualTeleportationObj = null;
        }


        if (actualThrowObject != null) {
            if (selectPressedLeft) {
                actualThrowObject.getComponent(f.ComponentRigidbody).setPosition(leftController.mtxWorld.translation);
            }
            if (selectPressedRight) {
                actualThrowObject.getComponent(f.ComponentRigidbody).setPosition(rightController.mtxWorld.translation);
            }
        }

        f.Physics.simulate();
        xrViewport.draw();
        f.AudioManager.default.update();

    }

    function onSqueeze(_event: XRInputSourceEvent): void {
        if (actualTeleportationObj) {
            let newPos: f.Vector3 = f.Vector3.DIFFERENCE(cmpCamera.mtxWorld.translation, actualTeleportationObj.getComponent(f.ComponentTransform).mtxLocal.translation);
            newPos.y -= 0.5;
            f.XRViewport.setNewXRRigidtransform(newPos);
            actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
            actualTeleportationObj = null;
        }
    }

    function onSelectStart(_event: XRInputSourceEvent): void {
        if (actualThrowObject) {
            if (_event.inputSource.handedness == "right") {
                selectPressedRight = true;
            }
            if (_event.inputSource.handedness == "left") {
                selectPressedLeft = true;
            }
        }
    }

    function onSelectEnd(_event: XRInputSourceEvent): void {
        if (actualThrowObject) {
            if (_event.inputSource.handedness == "right") {
                actualThrowObject.getComponent(f.ComponentRigidbody).setVelocity(f.Vector3.ZERO());
                let velocity: f.Vector3 = f.Vector3.DIFFERENCE(rightController.mtxLocal.translation, cmpCamera.mtxPivot.translation);
                velocity.scale(20);
                actualThrowObject.getComponent(f.ComponentRigidbody).addVelocity(velocity);
                actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualThrowObject = null;
                selectPressedRight = false;
            } else {
                actualThrowObject.getComponent(f.ComponentRigidbody).setVelocity(f.Vector3.ZERO());
                let direction: f.Vector3 = f.Vector3.DIFFERENCE(leftController.mtxLocal.translation, cmpCamera.mtxPivot.translation);
                direction.scale(20);
                actualThrowObject.getComponent(f.ComponentRigidbody).addVelocity(direction);
                actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualThrowObject = null;
                selectPressedLeft = false;
            }
        }

    }

    function onEndSession(): void {
        f.Loop.stop();
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
    }
}

