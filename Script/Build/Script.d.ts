declare namespace VRIntegration {
    import f = FudgeCore;
    class CubeTranslation extends f.ComponentScript {
        static readonly iSubclass: number;
        message: string;
        constructor();
        hndEvent: (_event: Event) => void;
    }
}
declare namespace VRIntegration {
    import f = FudgeCore;
    class CustomComponentScript extends f.ComponentScript {
        static readonly iSubclass: number;
        message: string;
        constructor();
        hndEvent: (_event: Event) => void;
        private update;
    }
}
declare namespace VRIntegration {
    import f = FudgeCore;
    let graph: f.Graph;
    let cmpCamera: f.ComponentCamera;
}
