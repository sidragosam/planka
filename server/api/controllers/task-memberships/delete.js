/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /task-memberships/{id}:
 *   delete:
 *     summary: Remove user from task
 *     description: Removes a user from a task. Requires board editor permissions.
 *     tags:
 *       - Task Memberships
 *     operationId: deleteTaskMembership
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the task membership to delete
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     responses:
 *       200:
 *         description: User removed from task successfully
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
 */

const Errors = {
  TASK_MEMBERSHIP_NOT_FOUND: {
    taskMembershipNotFound: 'Task membership not found',
  },
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
};

module.exports = {
  inputs: {
    id: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    taskMembershipNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const taskMembership = await TaskMembership.qm.getOneById(inputs.id);

    if (!taskMembership) {
      throw Errors.TASK_MEMBERSHIP_NOT_FOUND;
    }

    const { task, taskList, card, list, board, project } = await sails.helpers.tasks
      .getPathToProjectById(taskMembership.taskId)
      .intercept('pathNotFound', () => Errors.TASK_MEMBERSHIP_NOT_FOUND);

    const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      currentUser.id,
    );

    if (!boardMembership) {
      throw Errors.TASK_MEMBERSHIP_NOT_FOUND; // Forbidden
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    const user = await User.qm.getOneById(taskMembership.userId);

    const deletedTaskMembership = await sails.helpers.taskMemberships.deleteOne.with({
      task,
      user,
      project,
      board,
      list,
      card,
      taskList,
      actorUser: currentUser,
      request: this.req,
    });

    return {
      item: deletedTaskMembership,
    };
  },
};
