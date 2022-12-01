"use strict";
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class CustomComponentScript extends ƒ.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static iSubclass = ƒ.Component.registerSubclass(CustomComponentScript);
        // Properties may be mutated by users in the editor via the automatically created user interface
        message = "CustomComponentScript added to ";
        constructor() {
            super();
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* NODE_DESERIALIZED */, this.hndEvent);
        }
        // Activate the functions of this component as response to events
        hndEvent = (_event) => {
            switch (_event.type) {
                case "componentAdd" /* COMPONENT_ADD */:
                    ƒ.Debug.log(this.message, this.node);
                    break;
                case "componentRemove" /* COMPONENT_REMOVE */:
                    this.removeEventListener("componentAdd" /* COMPONENT_ADD */, this.hndEvent);
                    this.removeEventListener("componentRemove" /* COMPONENT_REMOVE */, this.hndEvent);
                    break;
                case "nodeDeserialized" /* NODE_DESERIALIZED */:
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    break;
            }
        };
    }
    Script.CustomComponentScript = CustomComponentScript;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var f = FudgeCore;
    f.Debug.info("Main Program Template running!");
    let xrViewport = new f.XRViewport();
    let graph = null;
    let cmpCamera = null;
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
        cmpCamera.clrBackground = f.Color.CSS("lightsteelblue", 0.25);
        xrViewport.initialize("Viewport", graph, cmpCamera, canvas);
        xrViewport.draw();
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
        checkForVRSupport();
    }
    // check device/browser capabilities for XR Session 
    function checkForVRSupport() {
        navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
            if (supported)
                initializeVR();
            else
                console.log("Session not supported");
        });
    }
    //main function to start XR Session
    function initializeVR() {
        //create XR Button -> Browser 
        let enterXRButton = document.createElement("button");
        enterXRButton.id = "xrButton";
        enterXRButton.innerHTML = "Enter VR";
        document.body.appendChild(enterXRButton);
        enterXRButton.addEventListener("click", async function () {
            //initalizes xr session 
            await xrViewport.initializeXR("immersive-vr", "local", true);
            initializeRays();
            //stop normal loop of winodws.animationFrame
            f.Loop.stop();
            //set xr transform to matrix from ComponentCamera -> xr transform = camera transform
            xrViewport.xr.setNewXRRigidtransform(f.Vector3.DIFFERENCE(f.Vector3.ZERO(), cmpCamera.mtxWorld.translation));
            //start xrSession.animationFrame instead of window.animationFrame, your xr-session is ready to go!
            f.Loop.start(f.LOOP_MODE.FRAME_REQUEST_XR);
        });
    }
    function initializeRays() {
        let pickableObjects = graph.getChildrenByName("CubeContainer")[0].getChildren();
        let rightRayNode = graph.getChildrenByName("raysContainer")[0].getChild(0);
        let leftRayNode = graph.getChildrenByName("raysContainer")[0].getChild(1);
        rightRayNode.addComponent(new Script.RayHelper(xrViewport, xrViewport.xr.rightController, 50, pickableObjects));
        leftRayNode.addComponent(new Script.RayHelper(xrViewport, xrViewport.xr.leftController, 50, pickableObjects));
    }
    function update(_event) {
        // f.Physics.simulate();  // if physics is included and used
        xrViewport.draw();
        // f.AudioManager.default.update();
    }
})(Script || (Script = {}));
var Script;
(function (Script) {
    var f = FudgeCore;
    f.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class RayHelper extends f.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        //  public static readonly iSubclass: number = f.Component.registerSubclass(RayHelper);
        // Properties may be mutated by users in the editor via the automatically created user interface
        xrViewport = null;
        controllerTransform;
        lengthRay;
        pickableObjects;
        constructor(_xrViewport, _controllerTransform, _lengthRay, _pickableObjects) {
            super();
            this.xrViewport = _xrViewport;
            this.controllerTransform = _controllerTransform;
            this.lengthRay = _lengthRay;
            this.pickableObjects = _pickableObjects;
            // Don't start when running in editor
            if (f.Project.mode == f.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* NODE_DESERIALIZED */, this.hndEvent);
        }
        // Activate the functions of this component as response to events
        hndEvent = (_event) => {
            switch (_event.type) {
                case "componentAdd" /* COMPONENT_ADD */:
                    f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, this.update);
                    f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
                    break;
                case "componentRemove" /* COMPONENT_REMOVE */:
                    this.removeEventListener("componentAdd" /* COMPONENT_ADD */, this.hndEvent);
                    this.removeEventListener("componentRemove" /* COMPONENT_REMOVE */, this.hndEvent);
                    break;
                case "nodeDeserialized" /* NODE_DESERIALIZED */:
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    break;
            }
        };
        computeRay = (_rayTransform, rayNode) => {
            let vecZCntrl = _rayTransform.mtxLocal.getZ();
            let ray = new f.Ray(new f.Vector3(-vecZCntrl.x, -vecZCntrl.y, -vecZCntrl.z), _rayTransform.mtxLocal.translation, this.lengthRay);
            rayNode.getComponent(f.ComponentTransform).mtxLocal = _rayTransform.mtxLocal;
            rayNode.getComponent(f.ComponentMesh).mtxPivot.scaling = new f.Vector3(0.1, this.lengthRay, 0.1);
            rayNode.getComponent(f.ComponentMesh).mtxPivot.translation = new f.Vector3(0, 0, -this.lengthRay / 2);
            let picker = f.Picker.pickRay(this.pickableObjects, ray, 0, this.lengthRay);
            picker.forEach(element => {
                console.log("R: " + element);
            });
            // let crc2: CanvasRenderingContext2D = xrViewport.context;
            // console.log(crc2);
            // crc2.moveTo(0, 0);
            // crc2.lineTo(600, 600);
            // crc2.strokeStyle = "white";
            // crc2.stroke();
        };
        update = () => {
            if (this.xrViewport.xr.xrSession)
                this.computeRay(this.controllerTransform, this.node);
        };
    }
    Script.RayHelper = RayHelper;
})(Script || (Script = {}));
//# sourceMappingURL=Script.js.map