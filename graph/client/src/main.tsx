/* eslint-disable import/first */
// debug must be first import
if (process.env.NODE_ENV === 'development') {
  require('preact/debug');
}

import { projectDetailsMachine } from './app/console-project-details/project-details.machine';
/* eslint-disable @nx/enforce-module-boundaries */
// nx-ignore-next-line
import type {
  ProjectGraph,
  ProjectGraphProjectNode,
  TaskGraph,
} from '@nx/devkit';
// nx-ignore-next-line
import type { GraphError } from 'nx/src/command-line/graph/graph';
// nx-ignore-next-line
import { MigrationsJsonMetadata } from 'nx/src/command-line/migrate/migrate-ui-api';
// nx-ignore-next-line
import { GeneratedMigrationDetails } from 'nx/src/config/misc-interfaces';
/* eslint-enable @nx/enforce-module-boundaries */
import { inspect } from '@xstate/inspect';
import { render } from 'preact';
import { StrictMode } from 'react';
import { interpret } from 'xstate';
import { App } from './app/app';
import { ProjectGraphApp } from './app/console-graph/project-graph.app';
import { projectGraphMachine } from './app/console-graph/project-graph.machine';
import { MigrateApp } from './app/console-migrate/migrate.app';
import { migrateMachine } from './app/console-migrate/migrate.machine';
import { ProjectDetailsApp } from './app/console-project-details/project-details.app';
import { ExternalApiImpl } from './app/external-api-impl';
import { ErrorPage } from './app/ui-components/error-page';
import { taskGraphMachine } from './app/console-graph/task-graph.machine';
import { TaskGraphApp } from './app/console-graph/task-graph.app';

console.log('hello', window.__NX_RENDER_GRAPH__);
if (true) {
  window.externalApi = new ExternalApiImpl();

  window.renderPDV = (data: {
    project: ProjectGraphProjectNode;
    sourceMap: Record<string, string[]>;
    connectedToCloud: boolean;
    errors?: GraphError[];
  }) => {
    const service = interpret(projectDetailsMachine).start();

    service.send({
      type: 'loadData',
      ...data,
    });

    render(
      <StrictMode>
        <ProjectDetailsApp service={service} />
      </StrictMode>,
      document.getElementById('app')
    );

    return service;
  };

  window.renderError = (data: {
    message: string;
    stack?: string;
    errors: GraphError[];
  }) => {
    render(
      <StrictMode>
        <ErrorPage {...data} />
      </StrictMode>,
      document.getElementById('app')
    );
  };

  window.renderMigrate = (data: {
    migrations: GeneratedMigrationDetails[];
    'nx-console': MigrationsJsonMetadata;
  }) => {
    const service = interpret(migrateMachine).start();

    service.send({
      type: 'loadData',
      ...data,
    });

    render(
      <StrictMode>
        <MigrateApp service={service} />
      </StrictMode>,
      document.getElementById('app')
    );

    return service;
  };

  window.renderProjectGraph = (graphData: { projectGraph: ProjectGraph }) => {
    const service = interpret(projectGraphMachine).start();
    service.send({
      type: 'loadData',
      projectGraph: graphData.projectGraph,
    });

    render(
      <StrictMode>
        <ProjectGraphApp service={service} />
      </StrictMode>,
      document.getElementById('app')
    );

    return service;
  };

  window.renderTaskGraph = (graphData: {
    projectGraph: ProjectGraph;
    taskGraph: TaskGraph;
  }) => {
    const service = interpret(taskGraphMachine).start();
    service.send({
      type: 'loadData',
      projectGraph: graphData.projectGraph,
      taskGraph: graphData.taskGraph,
    });

    render(
      <StrictMode>
        <TaskGraphApp service={service} />
      </StrictMode>,
      document.getElementById('app')
    );

    return service;
  };
} else {
  if (window.useXstateInspect === true) {
    inspect({
      url: 'https://stately.ai/viz?inspect',
      iframe: false, // open in new window
    });
  }

  window.externalApi = new ExternalApiImpl();
  const container = document.getElementById('app');

  if (!window.appConfig) {
    render(
      <p>
        No environment could be found. Please run{' '}
        <pre>npx nx run graph-client:generate-dev-environment-js</pre>.
      </p>,
      container
    );
  } else {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
      container
    );
  }
}
