/// <reference types="../../FudgeCore/FudgeCore" />
declare namespace Script {
    import ƒ = FudgeCore;
    class CustomComponentScript extends ƒ.ComponentScript {
        static readonly iSubclass: number;
        message: string;
        constructor();
        hndEvent: (_event: Event) => void;
    }
}
declare namespace Script {
}
declare namespace Script {
    import f = FudgeCore;
    class RayHelper extends f.ComponentScript {
        private xrViewport;
        private controllerTransform;
        private lengthRay;
        private pickableObjects;
        constructor(_xrViewport: f.XRViewport, _controllerTransform: f.ComponentTransform, _lengthRay: number, _pickableObjects: f.Node[]);
        hndEvent: (_event: Event) => void;
        private computeRay;
        private update;
    }
}
