import { ProjectGraph, TaskGraph } from '@nx/devkit';
import { RenderGraphConfigEvent } from '@nx/graph';
import { TaskGraphHandleEventResult } from '@nx/graph/tasks/task-graph-client';
import { TaskGraphEvent } from '@nx/graph/tasks/task-graph-event';
import { ActorRef, assign, createMachine, send, spawn } from 'xstate';
import { GRAPH_CLIENT_EVENTS } from '../feature-projects/machines/project-graph.machine';
import {
  graphClientActor,
  TASK_GRAPH_EVENTS,
} from '../feature-tasks/graph.actor';
import { TaskGraphClientActor } from '../feature-tasks/interfaces';

export interface TaskGraphStateMachineContext {
  projectGraph: null | ProjectGraph;
  taskGraph: null | TaskGraph;
  graphActor: ActorRef<TaskGraphEvent | RenderGraphConfigEvent>;
  handleEventResult: TaskGraphHandleEventResult | null;
}

const initialContext: TaskGraphStateMachineContext = {
  projectGraph: null,
  taskGraph: null,
  graphActor: null,
  handleEventResult: null,
};
export type TaskGraphStateMachineEvents =
  | {
      type: 'loadData';
      projectGraph: ProjectGraph;
      taskGraph: TaskGraph;
    }
  | {
      type: 'setGraphClient';
      graphClient: TaskGraphClientActor;
    }
  | {
      type: 'handleEventResult';
      result: TaskGraphHandleEventResult;
    };
export const taskGraphMachine = createMachine<
  TaskGraphStateMachineContext,
  TaskGraphStateMachineEvents
>(
  {
    id: 'taskGraph',
    initial: 'idle',
    context: initialContext,
    states: {
      idle: {},
      loaded: {},
    },
    on: {
      loadData: [
        {
          target: 'loaded',
          actions: [
            assign({
              projectGraph: (_, event) => event.projectGraph,
              taskGraph: (_, event) => event.taskGraph,
            }),
          ],
        },
      ],
      setGraphClient: {
        actions: [
          assign({
            graphActor: (_, event) =>
              spawn(
                graphClientActor(event.graphClient),
                'taskGraphClientActor'
              ),
          }),
        ],
      },
      handleEventResult: {
        actions: [
          assign({
            handleEventResult: (_, event) => event.result,
          }),
        ],
      },
      '*': {
        cond: 'isGraphClientEvent',
        actions: ['sendToGraphActor'],
      },
    },
  },
  {
    guards: {
      isGraphClientEvent: (ctx, event) => {
        return TASK_GRAPH_EVENTS.has(event.type) && ctx.graphActor !== null;
      },
    },
    actions: {
      sendToGraphActor: send((_, event) => event, {
        to: (ctx) => ctx.graphActor,
      }),
    },
  }
);
