/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    task: {
      type: 'ref',
      required: true,
    },
    user: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    board: {
      type: 'ref',
      required: true,
    },
    list: {
      type: 'ref',
      required: true,
    },
    card: {
      type: 'ref',
      required: true,
    },
    taskList: {
      type: 'ref',
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const taskMembership = await TaskMembership.qm.getOneByTaskIdAndUserId(
      inputs.task.id,
      inputs.user.id,
    );

    if (!taskMembership) {
      return taskMembership;
    }

    await TaskMembership.qm.deleteOne(taskMembership.id);

    sails.sockets.broadcast(
      `board:${inputs.board.id}`,
      'taskMembershipDelete',
      {
        item: taskMembership,
      },
      inputs.request,
    );

    const webhooks = await Webhook.qm.getAll();

    sails.helpers.utils.sendWebhooks.with({
      webhooks,
      event: Webhook.Events.TASK_MEMBERSHIP_DELETE,
      buildData: () => ({
        item: taskMembership,
        included: {
          users: [inputs.user],
          projects: [inputs.project],
          boards: [inputs.board],
          lists: [inputs.list],
          cards: [inputs.card],
          taskLists: [inputs.taskList],
          tasks: [inputs.task],
        },
      }),
      user: inputs.actorUser,
    });

    await sails.helpers.actions.createOne.with({
      webhooks,
      values: {
        type: Action.Types.REMOVE_MEMBER_FROM_TASK,
        data: {
          user: _.pick(inputs.user, ['id', 'name']),
          task: _.pick(inputs.task, ['name']),
        },
        user: inputs.actorUser,
        card: inputs.card,
      },
      project: inputs.project,
      board: inputs.board,
      list: inputs.list,
    });

    return taskMembership;
  },
};
