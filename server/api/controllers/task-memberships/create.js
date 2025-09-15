/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /tasks/{taskId}/memberships:
 *   post:
 *     summary: Add user to task
 *     description: Adds a user to a task. Requires board editor permissions.
 *     tags:
 *       - Task Memberships
 *     operationId: createTaskMembership
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         description: ID of the task to add the user to
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to add to the task
 *                 example: "1357158568008091265"
 *     responses:
 *       200:
 *         description: User added to task successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/TaskMembership'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: User is already a member of this task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

const { v4: uuid } = require('uuid');

const Errors = {
  TASK_NOT_FOUND: {
    taskNotFound: 'Task not found',
  },
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  USER_NOT_FOUND: {
    userNotFound: 'User not found',
  },
  USER_ALREADY_TASK_MEMBER: {
    userAlreadyTaskMember: 'User already task member',
  },
};

module.exports = {
  inputs: {
    taskId: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
    userId: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    taskNotFound: {
      responseType: 'notFound',
    },
    userNotFound: {
      responseType: 'notFound',
    },
    userAlreadyTaskMember: {
      responseType: 'conflict',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const { task, taskList, card, list, board, project } = await sails.helpers.tasks
      .getPathToProjectById(inputs.taskId)
      .intercept('pathNotFound', () => Errors.TASK_NOT_FOUND);

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.TASK_NOT_FOUND; // Forbidden
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    const user = await User.qm.getOneById(inputs.userId);

    if (!user) {
      throw Errors.USER_NOT_FOUND;
    }

    const isBoardMember = await sails.helpers.users.isBoardMember(user.id, board.id);

    if (!isBoardMember) {
      throw Errors.USER_NOT_FOUND; // Forbidden
    }

    const taskMembership = await sails.helpers.taskMemberships.createOne
      .with({
        project,
        board,
        list,
        card,
        taskList,
        values: {
          task,
          user,
        },
        actorUser: currentUser,
        request: this.req,
      })
      .intercept('userAlreadyTaskMember', () => Errors.USER_ALREADY_TASK_MEMBER);

    return {
      item: taskMembership,
    };
  },
};
