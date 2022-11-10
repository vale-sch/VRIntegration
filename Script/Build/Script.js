"use strict";
var VRIntegration;
(function (VRIntegration) {
    var f = FudgeCore;
    f.Project.registerScriptNamespace(VRIntegration); // Register the namespace to FUDGE for serialization
    class CustomComponentScript extends f.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static iSubclass = f.Component.registerSubclass(CustomComponentScript);
        // Properties may be mutated by users in the editor via the automatically created user interface
        message = "CustomComponentScript added to ";
        constructor() {
            super();
            // Don't start when running in editor
            if (f.Project.mode == f.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* f.EVENT.COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* f.EVENT.COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* f.EVENT.NODE_DESERIALIZED */, this.hndEvent);
        }
        // Activate the functions of this component as response to events
        hndEvent = (_event) => {
            switch (_event.type) {
                case "componentAdd" /* f.EVENT.COMPONENT_ADD */:
                    f.Loop.addEventListener("loopFrame" /* f.EVENT.LOOP_FRAME */, this.update);
                    f.Loop.start();
                    break;
                case "componentRemove" /* f.EVENT.COMPONENT_REMOVE */:
                    this.removeEventListener("componentAdd" /* f.EVENT.COMPONENT_ADD */, this.hndEvent);
                    this.removeEventListener("componentRemove" /* f.EVENT.COMPONENT_REMOVE */, this.hndEvent);
                    break;
                case "nodeDeserialized" /* f.EVENT.NODE_DESERIALIZED */:
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    break;
            }
        };
        hasToTurn = false;
        update = (_event) => {
            if (this.node.name != "FudgeLogo") {
                if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x < 6.1 && !this.hasToTurn) {
                    this.node.getComponent(f.ComponentRigidbody).applyForce(f.Vector3.X(2.2));
                    if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x > 6)
                        this.hasToTurn = true;
                }
                else if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x > -6.1 && this.hasToTurn) {
                    this.node.getComponent(f.ComponentRigidbody).applyForce(f.Vector3.X(-2.2));
                    if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x < -6)
                        this.hasToTurn = false;
                }
            }
            else
                this.node.getComponent(f.ComponentTransform).mtxLocal.rotateY(0.1);
        };
    }
    VRIntegration.CustomComponentScript = CustomComponentScript;
})(VRIntegration || (VRIntegration = {}));
var VRIntegration;
(function (VRIntegration) {
    var f = FudgeCore;
    let xrViewport = new f.XRViewport();
    let graph = null;
    let cmpCamera = null;
    let rightController = null;
    let leftController = null;
    window.addEventListener("load", init);
    async function init() {
        await FudgeCore.Project.loadResources("Internal.json");
        graph = f.Project.resources[document.head.querySelector("meta[autoView]").getAttribute("autoView")];
        FudgeCore.Debug.log("Graph:", graph);
        if (!graph) {
            alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
            return;
        }
        let canvas = document.querySelector("canvas");
        cmpCamera = graph.getChildrenByName("Camera")[0].getComponent(f.ComponentCamera);
        setupAudio();
        xrViewport.physicsDebugMode = f.PHYSICS_DEBUGMODE.JOINTS_AND_COLLIDER;
        xrViewport.initialize("Viewport", graph, cmpCamera, canvas);
        rightController = graph.getChildrenByName("rightController")[0];
        leftController = graph.getChildrenByName("leftController")[0];
        xrViewport.draw();
        f.Loop.addEventListener("loopFrame" /* f.EVENT.LOOP_FRAME */, update);
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
        checkForVRSupport();
    }
    function setupAudio() {
        let cmpListener = new f.ComponentAudioListener();
        cmpCamera.node.addComponent(cmpListener);
        f.AudioManager.default.listenTo(graph);
        f.AudioManager.default.listenWith(cmpCamera.node.getComponent(f.ComponentAudioListener));
    }
    function checkForVRSupport() {
        navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
            if (supported)
                initializeVR();
            else
                console.log("Session not supported");
        });
    }
    function initializeVR() {
        let enterXRButton = document.createElement("button");
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
        });
    }
    let actualTeleportationObj = null;
    let actualThrowObject = null;
    let selectPressedRight = false;
    let selectPressedLeft = false;
    let hasHitThisFrameTeleObj = false;
    function update(_event) {
        hasHitThisFrameTeleObj = false;
        rightController.getComponent(f.ComponentTransform).mtxLocal = f.XRViewport.rightController.mtxLocal;
        leftController.getComponent(f.ComponentTransform).mtxLocal = f.XRViewport.leftController.mtxLocal;
        let vecZRightCntrl = f.XRViewport.rightController.mtxLocal.getZ();
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
        let vecZLeftCntrl = f.XRViewport.leftController.mtxLocal.getZ();
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
    function onSqueeze(_event) {
        if (actualTeleportationObj) {
            let newPos = f.Vector3.DIFFERENCE(cmpCamera.mtxWorld.translation, actualTeleportationObj.getComponent(f.ComponentTransform).mtxLocal.translation);
            newPos.y -= 0.5;
            f.XRViewport.setNewXRRigidtransform(newPos);
            actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
            actualTeleportationObj = null;
        }
    }
    function onSelectStart(_event) {
        if (actualThrowObject) {
            if (_event.inputSource.handedness == "right") {
                selectPressedRight = true;
            }
            if (_event.inputSource.handedness == "left") {
                selectPressedLeft = true;
            }
        }
    }
    function onSelectEnd(_event) {
        if (actualThrowObject) {
            if (_event.inputSource.handedness == "right") {
                actualThrowObject.getComponent(f.ComponentRigidbody).setVelocity(f.Vector3.ZERO());
                let velocity = f.Vector3.DIFFERENCE(rightController.mtxLocal.translation, cmpCamera.mtxPivot.translation);
                velocity.scale(20);
                actualThrowObject.getComponent(f.ComponentRigidbody).addVelocity(velocity);
                actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualThrowObject = null;
                selectPressedRight = false;
            }
            else {
                actualThrowObject.getComponent(f.ComponentRigidbody).setVelocity(f.Vector3.ZERO());
                let direction = f.Vector3.DIFFERENCE(leftController.mtxLocal.translation, cmpCamera.mtxPivot.translation);
                direction.scale(20);
                actualThrowObject.getComponent(f.ComponentRigidbody).addVelocity(direction);
                actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualThrowObject = null;
                selectPressedLeft = false;
            }
        }
    }
    function onEndSession() {
        f.Loop.stop();
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
    }
})(VRIntegration || (VRIntegration = {}));
//# sourceMappingURL=Script.js.map