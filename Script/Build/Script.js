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
        update = (_event) => {
            this.node.getComponent(f.ComponentTransform).mtxLocal.rotateY(1);
        };
    }
    VRIntegration.CustomComponentScript = CustomComponentScript;
})(VRIntegration || (VRIntegration = {}));
var VRIntegration;
(function (VRIntegration) {
    window.addEventListener("load", checkForSupport);
    function checkForSupport() {
        let canvas = document.querySelector("canvas");
        new VRIntegration.XRConnection(canvas, null);
    }
})(VRIntegration || (VRIntegration = {}));
var VRIntegration;
(function (VRIntegration) {
    var f = FudgeCore;
    class XRConnection {
        gl;
        glCanvas;
        then = 0.0;
        viewport;
        constructor(canvas, gl) {
            this.glCanvas = canvas;
            this.init();
        }
        async init() {
            await FudgeCore.Project.loadResources("Internal.json");
            let madeMazeGraph = f.Project.resources[document.head.querySelector("meta[autoView]").getAttribute("autoView")];
            FudgeCore.Debug.log("Graph:", madeMazeGraph);
            if (!madeMazeGraph) {
                alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
                return;
            }
            // setup the viewport
            let cmpCamera = madeMazeGraph.getChildrenByName("Camera")[0].getComponent(f.ComponentCamera);
            //cmpCamera.mtxPivot.rotateX(90);
            // cmpCamera.mtxPivot.translateY(10);
            this.viewport = new f.Viewport();
            this.viewport.initialize("Viewport", madeMazeGraph, cmpCamera, this.glCanvas, true);
            // this.gl = this.glCanvas.getContext("webgl2");
            this.viewport.draw();
            f.Loop.addEventListener("loopFrame" /* f.EVENT.LOOP_FRAME */, this.update);
            f.Loop.start();
        }
        update = (_event) => {
            // ƒ.Physics.simulate();  // if physics is included and used
            this.viewport.draw();
            //f.AudioManager.default.update();
        };
    }
    VRIntegration.XRConnection = XRConnection;
})(VRIntegration || (VRIntegration = {}));
//# sourceMappingURL=Script.js.map