import { NxJsonConfiguration } from '../../config/nx-json';
import { ProjectGraph } from '../../config/project-graph';
import { HashPlanner, transferProjectGraph } from '../../native';
import { transformProjectGraphForRust } from '../../native/transform-objects';
import { createTaskGraph } from '../../tasks-runner/create-task-graph';
import { TaskGraphClientResponse } from './graph';

export type TaskGraphResponse = TaskGraphClientResponse;

/**
 * Creates a single task graph for multiple projects with multiple targets
 * If no projects specified, returns graph for all projects with the targets
 */
export async function createTaskGraphForTargetsAndProjects(
  projectGraph: ProjectGraph,
  nxJson: NxJsonConfiguration,
  targetNames: string[],
  projectNames?: string[],
  configuration?: string
): Promise<TaskGraphResponse> {
  performance.mark(`task graph generation:start`);

  let projectsToUse: string[];
  if (projectNames && projectNames.length > 0) {
    projectsToUse = projectNames;
  } else {
    // Get all projects that have at least one of the targets
    projectsToUse = Object.entries(projectGraph.nodes)
      .filter(([_, project]) =>
        targetNames.some((targetName) => project.data.targets?.[targetName])
      )
      .map(([projectName]) => projectName);
  }

  try {
    // Create single task graph
    const taskGraph = createTaskGraph(
      projectGraph,
      {},
      projectsToUse,
      targetNames,
      configuration,
      {}
    );

    performance.mark(`task graph generation:end`);

    const planner = new HashPlanner(
      nxJson,
      transferProjectGraph(transformProjectGraphForRust(projectGraph))
    );
    performance.mark('task hash plan generation:start');

    const taskIds = Object.keys(taskGraph.tasks);
    const plans =
      taskIds.length > 0 ? planner.getPlans(taskIds, taskGraph) : {};

    performance.mark('task hash plan generation:end');

    performance.measure(
      `task graph generation for ${targetNames.join(', ')}`,
      `task graph generation:start`,
      `task graph generation:end`
    );
    performance.measure(
      'task hash plan generation',
      'task hash plan generation:start',
      'task hash plan generation:end'
    );

    return { taskGraph, plans, error: null };
  } catch (err) {
    performance.mark(`task graph generation:end`);
    performance.measure(
      `task graph generation for ${targetNames.join(', ')} (failed)`,
      `task graph generation:start`,
      `task graph generation:end`
    );

    return {
      taskGraph: {
        tasks: {},
        dependencies: {},
        continuousDependencies: {},
        roots: [],
      },
      plans: {},
      error: err.message,
    };
  }
}
