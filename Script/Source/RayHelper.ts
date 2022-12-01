namespace Script {
    import f = FudgeCore;
    f.Project.registerScriptNamespace(Script);  // Register the namespace to FUDGE for serialization

    export class RayHelper extends f.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        //  public static readonly iSubclass: number = f.Component.registerSubclass(RayHelper);

        // Properties may be mutated by users in the editor via the automatically created user interface
        private xrViewport: f.XRViewport = null;
        private controllerTransform: f.ComponentTransform;
        private lengthRay: number;
        private pickableObjects: f.Node[];
        constructor(_xrViewport: f.XRViewport, _controllerTransform: f.ComponentTransform, _lengthRay: number, _pickableObjects: f.Node[]) {
            super();
            this.xrViewport = _xrViewport;
            this.controllerTransform = _controllerTransform;
            this.lengthRay = _lengthRay;
            this.pickableObjects = _pickableObjects;
            // Don't start when running in editor
            if (f.Project.mode == f.MODE.EDITOR)
                return;

            // Listen to this component being added to or removed from a node
            this.addEventListener(f.EVENT.COMPONENT_ADD, this.hndEvent);
            this.addEventListener(f.EVENT.COMPONENT_REMOVE, this.hndEvent);
            this.addEventListener(f.EVENT.NODE_DESERIALIZED, this.hndEvent);
        }

        // Activate the functions of this component as response to events
        public hndEvent = (_event: Event): void => {
            switch (_event.type) {
                case f.EVENT.COMPONENT_ADD:
                    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, this.update);
                    f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
                    break;
                case f.EVENT.COMPONENT_REMOVE:
                    this.removeEventListener(f.EVENT.COMPONENT_ADD, this.hndEvent);
                    this.removeEventListener(f.EVENT.COMPONENT_REMOVE, this.hndEvent);
                    break;
                case f.EVENT.NODE_DESERIALIZED:
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    break;
            }
        }

        private computeRay = (_rayTransform: f.ComponentTransform, rayNode: f.Node): void => {

            let vecZCntrl: f.Vector3 = _rayTransform.mtxLocal.getZ();
            let ray: f.Ray = new f.Ray(new f.Vector3(-vecZCntrl.x, -vecZCntrl.y, -vecZCntrl.z), _rayTransform.mtxLocal.translation, this.lengthRay);
            rayNode.getComponent(f.ComponentTransform).mtxLocal = _rayTransform.mtxLocal;
            rayNode.getComponent(f.ComponentMesh).mtxPivot.scaling = new f.Vector3(0.1, this.lengthRay, 0.1);
            rayNode.getComponent(f.ComponentMesh).mtxPivot.translation = new f.Vector3(0, 0, -this.lengthRay / 2);
            let picker: f.Pick[] = f.Picker.pickRay(this.pickableObjects, ray, 0, this.lengthRay);




            picker.forEach(element => {
                console.log("R: " + element);
            });

            // let crc2: CanvasRenderingContext2D = xrViewport.context;
            // console.log(crc2);
            // crc2.moveTo(0, 0);
            // crc2.lineTo(600, 600);
            // crc2.strokeStyle = "white";
            // crc2.stroke();
        }

        private update = (): void => {
            if (this.xrViewport.xr.xrSession)
                this.computeRay(this.controllerTransform, this.node);
        }
    }
}