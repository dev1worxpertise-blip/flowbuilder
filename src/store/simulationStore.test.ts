import { expect, test } from "vitest";
import { useSimulationStore, findStartNode } from "./simulationStore";
import { buildCicdTemplate } from "../templates/templates";

test("findStartNode identifies root or start node", () => {
  const cicd = buildCicdTemplate();
  const start = findStartNode(cicd.nodes, cicd.edges);
  expect(start).not.toBeNull();
  expect(start!.id).toBe("ci1");
});

test("simulationStore starts, steps forward, and completes", () => {
  const cicd = buildCicdTemplate();
  const store = useSimulationStore.getState();

  store.startSimulation(cicd.nodes, cicd.edges);
  expect(useSimulationStore.getState().isActive).toBe(true);
  expect(useSimulationStore.getState().status).toBe("playing");
  expect(useSimulationStore.getState().currentNodeId).toBe("ci1");

  // Step from ci1 -> ci2
  useSimulationStore.getState().stepForward(cicd.nodes, cicd.edges);
  expect(useSimulationStore.getState().currentNodeId).toBe("ci2");
  expect(useSimulationStore.getState().activeEdgeId).toBe("e_ci1");

  // Step until reaching decision node
  useSimulationStore.getState().stepForward(cicd.nodes, cicd.edges); // ci3
  useSimulationStore.getState().stepForward(cicd.nodes, cicd.edges); // ci4
  useSimulationStore.getState().stepForward(cicd.nodes, cicd.edges); // ci5 (Decision)

  // Step on decision node should trigger branchChoice
  useSimulationStore.getState().stepForward(cicd.nodes, cicd.edges);
  const choice = useSimulationStore.getState().branchChoice;
  expect(choice).not.toBeNull();
  expect(choice!.branches.length).toBeGreaterThanOrEqual(2);

  // User chooses "Yes" branch
  const yesBranch = choice!.branches.find((b) => b.label.includes("Yes"))!;
  useSimulationStore.getState().chooseBranch(yesBranch.edgeId, yesBranch.targetId, cicd.nodes);
  expect(useSimulationStore.getState().branchChoice).toBeNull();
  expect(useSimulationStore.getState().currentNodeId).toBe(yesBranch.targetId);

  // Stop simulation
  useSimulationStore.getState().stopSimulation();
  expect(useSimulationStore.getState().isActive).toBe(false);
});
