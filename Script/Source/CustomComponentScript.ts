namespace VRIntegration {
  import f = FudgeCore;
  f.Project.registerScriptNamespace(VRIntegration);  // Register the namespace to FUDGE for serialization

  export class CustomComponentScript extends f.ComponentScript {
    // Register the script as component for use in the editor via drag&drop
    public static readonly iSubclass: number = f.Component.registerSubclass(CustomComponentScript);
    // Properties may be mutated by users in the editor via the automatically created user interface
    public message: string = "CustomComponentScript added to ";


    constructor() {
      super();

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
          f.Loop.start();


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
    private hasSetted: boolean = false;
    private update = (_event: Event): void => {
      this.node.getComponent(f.ComponentTransform).mtxLocal.rotateY(0.1);
      if (this.hasSetted) return;
      if (this.node.nChildren > 0 && this.node.name != "FudgeLogo")
        this.node.getChildren().forEach(element => {
          if (element.getComponent(f.ComponentMaterial))
            element.getComponent(f.ComponentMaterial).clrPrimary = new f.Color(f.random.getRange(0, 1), f.random.getRange(0, 1), f.random.getRange(0, 1), 1);
          element.getChildren().forEach(element => {
            if (element.getComponent(f.ComponentMaterial))
              element.getComponent(f.ComponentMaterial).clrPrimary = new f.Color(f.random.getRange(0, 1), f.random.getRange(0, 1), f.random.getRange(0, 1), 1);
          });
          this.hasSetted = true;
        });
    }

    // protected reduceMutator(_mutator: ƒ.Mutator): void {
    //   // delete properties that should not be mutated
    //   // undefined properties and private fields (#) will not be included by default
    // }
  }
}