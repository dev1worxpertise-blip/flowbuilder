import { CardNode } from "./CardNode";
import { DecisionNode } from "./DecisionNode";
import { PillNode } from "./PillNode";
import { LabelNode } from "./LabelNode";
import { NoteNode } from "./NoteNode";
import { GroupNode } from "./GroupNode";
import { ShapeNode } from "./shapes";

export const nodeTypes = {
  card: CardNode,
  decision: DecisionNode,
  pill: PillNode,
  label: LabelNode,
  note: NoteNode,
  group: GroupNode,
  process: ShapeNode,
  io: ShapeNode,
  database: ShapeNode,
  document: ShapeNode,
  multidoc: ShapeNode,
  predefined: ShapeNode,
  preparation: ShapeNode,
  connector: ShapeNode,
  manualinput: ShapeNode,
  delay: ShapeNode,
  manualop: ShapeNode,
  offpage: ShapeNode,
};
