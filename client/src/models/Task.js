/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr, fk, many } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

export default class extends BaseModel {
  static modelName = 'Task';

  static fields = {
    id: attr(),
    position: attr(),
    name: attr(),
    isCompleted: attr({
      getDefault: () => false,
    }),
    taskListId: fk({
      to: 'TaskList',
      as: 'taskList',
      relatedName: 'tasks',
    }),
    linkedCardId: fk({
      to: 'Card',
      as: 'linkedCard',
      relatedName: 'linkedTasks',
    }),
    assigneeUserId: fk({
      to: 'User',
      as: 'user',
      relatedName: 'assignedTasks',
    }),
    users: many({
      to: 'User',
      through: 'TaskMembership',
      throughFields: ['taskId', 'userId'],
    }),
  };

  static reducer({ type, payload }, Task) {
    switch (type) {
      case ActionTypes.LOCATION_CHANGE_HANDLE:
      case ActionTypes.CORE_INITIALIZE:
      case ActionTypes.USER_UPDATE_HANDLE:
      case ActionTypes.PROJECT_UPDATE_HANDLE:
      case ActionTypes.PROJECT_MANAGER_CREATE_HANDLE:
      case ActionTypes.BOARD_MEMBERSHIP_CREATE_HANDLE:
      case ActionTypes.LIST_UPDATE_HANDLE:
      case ActionTypes.CARD_UPDATE_HANDLE:
        if (payload.tasks) {
          payload.tasks.forEach((task) => {
            Task.upsert(task);
          });
        }

        break;
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        Task.all().delete();

        if (payload.tasks) {
          payload.tasks.forEach((task) => {
            Task.upsert(task);
          });
        }

        break;
      case ActionTypes.BOARD_FETCH__SUCCESS:
      case ActionTypes.CARDS_FETCH__SUCCESS:
      case ActionTypes.CARD_CREATE_HANDLE:
      case ActionTypes.CARD_DUPLICATE__SUCCESS:
        payload.tasks.forEach((task) => {
          Task.upsert(task);
        });

        break;
      case ActionTypes.TASK_CREATE:
      case ActionTypes.TASK_CREATE_HANDLE:
      case ActionTypes.TASK_UPDATE__SUCCESS:
      case ActionTypes.TASK_UPDATE_HANDLE:
        Task.upsert(payload.task);

        break;
      case ActionTypes.TASK_CREATE__SUCCESS:
        Task.withId(payload.localId).delete();
        Task.upsert(payload.task);

        break;
      case ActionTypes.TASK_CREATE__FAILURE:
        Task.withId(payload.localId).delete();

        break;
      case ActionTypes.TASK_UPDATE:
        Task.withId(payload.id).update(payload.data);

        break;
      case ActionTypes.TASK_DELETE:
        Task.withId(payload.id).delete();

        break;
      case ActionTypes.TASK_DELETE__SUCCESS:
      case ActionTypes.TASK_DELETE_HANDLE: {
        const taskModel = Task.withId(payload.task.id);

        if (taskModel) {
          taskModel.delete();
        }

        break;
      }
      case ActionTypes.USER_TO_TASK_ADD: {
        const taskModel = Task.withId(payload.taskId);
        taskModel.users.add(payload.id);

        break;
      }
      case ActionTypes.USER_TO_TASK_ADD__SUCCESS:
      case ActionTypes.USER_TO_TASK_ADD_HANDLE:
        try {
          Task.withId(payload.taskMembership.taskId).users.add(payload.taskMembership.userId);
        } catch {
          /* empty */
        }

        break;
      case ActionTypes.USER_FROM_TASK_REMOVE:
        try {
          Task.withId(payload.taskId).users.remove(payload.id);
        } catch {
          /* empty */
        }

        break;
      case ActionTypes.USER_FROM_TASK_REMOVE__SUCCESS:
      case ActionTypes.USER_FROM_TASK_REMOVE_HANDLE:
        try {
          Task.withId(payload.taskMembership.taskId).users.remove(payload.taskMembership.userId);
        } catch {
          /* empty */
        }

        break;
      default:
    }
  }

  duplicate(id, data) {
    return this.getClass().create({
      id,
      taskListId: this.taskListId,
      assigneeUserId: this.assigneeUserId,
      position: this.position,
      name: this.name,
      isCompleted: this.isCompleted,
      ...data,
    });
  }
}
