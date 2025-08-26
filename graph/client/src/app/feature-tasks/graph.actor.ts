import { InvokeCallback } from 'xstate';

import { RenderGraphConfigEvent } from '@nx/graph';
import { TaskGraphClientActor } from './interfaces';
import { TaskGraphEvent } from '@nx/graph/tasks/task-graph-event';

export const TASK_GRAPH_EVENTS = new Set([
  'initGraph',
  'mergeGraph',
  'show',
  'hide',
  'toggleGroupByProject',
]);

export const graphClientActor =
  ({
    graphClient,
    send,
    sendRenderConfigEvent,
  }: TaskGraphClientActor): InvokeCallback<
    TaskGraphEvent | RenderGraphConfigEvent,
    TaskGraphEvent
  > =>
  (callback, onReceive) => {
    onReceive((event) => {
      console.log('actor received event', event);
      if (
        event.type === 'ThemeChange' ||
        event.type === 'ResetLayout' ||
        event.type === 'RankDirChange'
      ) {
        sendRenderConfigEvent(event);
      } else {
        send(event);
      }

      //   callback({ type: 'setGraphClientState', state: graphClient.graphState });
    });
  };
