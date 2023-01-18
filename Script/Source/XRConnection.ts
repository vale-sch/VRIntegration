
namespace VRIntegration {
    import f = FudgeCore;

    let xrViewport: f.XRViewport = new f.XRViewport();
    let graph: f.Graph = null;
    let cmpVRDevice: f.ComponentVRDevice = null;
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
        cmpVRDevice = graph.getChildrenByName("Camera")[0].getComponent(f.ComponentVRDevice);
        xrViewport.physicsDebugMode = f.PHYSICS_DEBUGMODE.JOINTS_AND_COLLIDER;
        xrViewport.initialize("Viewport", graph, cmpVRDevice, canvas);
        rightController = graph.getChildrenByName("rightController")[0];
        leftController = graph.getChildrenByName("leftController")[0];

        xrViewport.draw();
        f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);

        checkForVRSupport();
    }


    // check device/browser capabilities for XR Session 
    function checkForVRSupport(): void {
        navigator.xr.isSessionSupported(f.XR_SESSION_MODE.IMMERSIVE_VR).then((supported: boolean) => {
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
            await xrViewport.initializeVR(f.XR_SESSION_MODE.IMMERSIVE_VR, f.XR_REFERENCE_SPACE.LOCAL, true);

            //stop normal loop of winodws.animationFrame
            f.Loop.stop();

            //set controllers matrix information to component transform from node controller made in FUDGE Editor
            rightController.getComponent(f.ComponentTransform).mtxLocal = xrViewport.vrDevice.rightCntrl.cmpTransform.mtxLocal;
            leftController.getComponent(f.ComponentTransform).mtxLocal = xrViewport.vrDevice.leftCntrl.cmpTransform.mtxLocal;
            //set controllers buttons events
            xrViewport.session.addEventListener("squeeze", onSqueeze);
            xrViewport.session.addEventListener("selectstart", onSelectStart);
            xrViewport.session.addEventListener("selectend", onSelectEnd);
            xrViewport.session.addEventListener("end", onEndSession);




            //starts xr-session.animationFrame instead of window.animationFrame, your xr-session is ready to go!
            f.Loop.start(f.LOOP_MODE.FRAME_REQUEST_XR);
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
        if (xrViewport.session) {

            let vecZCntrlR = xrViewport.vrDevice.rightCntrl.cmpTransform.mtxLocal.getZ();
            this.rayHitInfoRight = FudgeCore.Physics.raycast(xrViewport.vrDevice.rightCntrl.cmpTransform.mtxLocal.translation, new FudgeCore.Vector3(-vecZCntrlR.x, -vecZCntrlR.y, -vecZCntrlR.z), 80, true);
            let vecZCntrlL = xrViewport.vrDevice.leftCntrl.cmpTransform.mtxLocal.getZ();
            this.rayHitInfoLeft = FudgeCore.Physics.raycast(xrViewport.vrDevice.leftCntrl.cmpTransform.mtxLocal.translation, new FudgeCore.Vector3(-vecZCntrlL.x, -vecZCntrlL.y, -vecZCntrlL.z), 80, true);


            if (this.rayHitInfoRight)
                if (this.rayHitInfoRight.hit) {
                    if (this.rayHitInfoRight.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && this.rayHitInfoRight.rigidbodyComponent.node.name != "New Node") {
                        hasHitThisFrameTeleObj = true;
                        actualTeleportationObj = this.rayHitInfoRight.rigidbodyComponent.node;
                        actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                    }
                    if (this.rayHitInfoRight.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && this.rayHitInfoRight.rigidbodyComponent.node.name == "New Node") {
                        if (this.rayHitInfoRight.rigidbodyComponent.node != actualThrowObject && actualThrowObject != null)
                            actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                        actualThrowObject = this.rayHitInfoRight.rigidbodyComponent.node;
                        actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                    }
                }
            if (this.rayHitInfoLeft)
                if (this.rayHitInfoLeft.hit) {
                    if (this.rayHitInfoLeft.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && this.rayHitInfoLeft.rigidbodyComponent.node.name != "New Node") {
                        hasHitThisFrameTeleObj = true;
                        actualTeleportationObj = this.rayHitInfoLeft.rigidbodyComponent.node;
                        actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                    }
                    if (this.rayHitInfoLeft.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && this.rayHitInfoLeft.rigidbodyComponent.node.name == "New Node") {
                        if (this.rayHitInfoLeft.rigidbodyComponent.node != actualThrowObject && actualThrowObject != null)
                            actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                        actualThrowObject = this.rayHitInfoLeft.rigidbodyComponent.node;
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
        }
        f.Physics.simulate();
        xrViewport.draw();
    }

    function onSqueeze(_event: XRInputSourceEvent): void {
        if (actualTeleportationObj) {
            xrViewport.vrDevice.position = actualTeleportationObj.getComponent(f.ComponentTransform).mtxLocal.translation;
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
                let velocity: f.Vector3 = f.Vector3.DIFFERENCE(rightController.mtxLocal.translation, xrViewport.camera.mtxWorld.translation);
                velocity.scale(20);
                actualThrowObject.getComponent(f.ComponentRigidbody).addVelocity(velocity);
                actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualThrowObject = null;
                selectPressedRight = false;
            } else {
                actualThrowObject.getComponent(f.ComponentRigidbody).setVelocity(f.Vector3.ZERO());
                let direction: f.Vector3 = f.Vector3.DIFFERENCE(leftController.mtxLocal.translation, xrViewport.camera.mtxWorld.translation);
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

