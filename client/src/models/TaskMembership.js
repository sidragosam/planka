/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'TaskMembership';

  static fields = {
    id: attr(),
    taskId: fk({
      to: 'Task',
      as: 'task',
      relatedName: 'memberships',
    }),
    userId: fk({
      to: 'User',
      as: 'user',
      relatedName: 'taskMemberships',
    }),
  };

  static reducer({ type, payload }, TaskMembership) {
    switch (type) {
      case ActionTypes.LOCATION_CHANGE_HANDLE:
      case ActionTypes.CORE_INITIALIZE:
      case ActionTypes.USER_UPDATE_HANDLE:
      case ActionTypes.PROJECT_UPDATE_HANDLE:
      case ActionTypes.PROJECT_MANAGER_CREATE_HANDLE:
      case ActionTypes.BOARD_MEMBERSHIP_CREATE_HANDLE:
      case ActionTypes.BOARD_FETCH__SUCCESS:
        if (payload.taskMemberships) {
          payload.taskMemberships.forEach((taskMembership) => {
            TaskMembership.upsert(taskMembership);
          });
        }

        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        TaskMembership.all().delete();

        if (payload.taskMemberships) {
          payload.taskMemberships.forEach((taskMembership) => {
            TaskMembership.upsert(taskMembership);
          });
        }

        break;
      case ActionTypes.USER_TO_TASK_ADD:
        TaskMembership.upsert({
          taskId: payload.taskId,
          userId: payload.id,
        });

        break;
      case ActionTypes.USER_TO_TASK_ADD__SUCCESS:
      case ActionTypes.USER_TO_TASK_ADD_HANDLE:
        try {
          TaskMembership.upsert(payload.taskMembership);
        } catch {
          /* empty */
        }

        break;
      case ActionTypes.USER_FROM_TASK_REMOVE:
        TaskMembership.filter({
          taskId: payload.taskId,
          userId: payload.id,
        }).delete();

        break;
      case ActionTypes.USER_FROM_TASK_REMOVE__SUCCESS:
      case ActionTypes.USER_FROM_TASK_REMOVE_HANDLE:
        try {
          TaskMembership.withId(payload.taskMembership.id).delete();
        } catch {
          /* empty */
        }

        break;
      default:
    }
  }
}
