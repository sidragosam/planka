/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    values: {
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

  exits: {
    userAlreadyTaskMember: {},
  },

  async fn(inputs) {
    const { values } = inputs;

    let taskMembership;
    try {
      taskMembership = await TaskMembership.qm.createOne({
        ...values,
        taskId: values.task.id,
        userId: values.user.id,
      });
    } catch (error) {
      if (error.code === 'E_UNIQUE') {
        throw 'userAlreadyTaskMember';
      }

      throw error;
    }

    sails.sockets.broadcast(
      `board:${inputs.board.id}`,
      'taskMembershipCreate',
      {
        item: taskMembership,
      },
      inputs.request,
    );

    const webhooks = await Webhook.qm.getAll();

    sails.helpers.utils.sendWebhooks.with({
      webhooks,
      event: Webhook.Events.TASK_MEMBERSHIP_CREATE,
      buildData: () => ({
        item: taskMembership,
        included: {
          users: [values.user],
          projects: [inputs.project],
          boards: [inputs.board],
          lists: [inputs.list],
          cards: [inputs.card],
          taskLists: [inputs.taskList],
          tasks: [values.task],
        },
      }),
      user: inputs.actorUser,
    });

    if (values.user.subscribeToOwnCards) {
      try {
        await sails.helpers.cardSubscriptions.createOne.with({
          values: {
            card: inputs.card,
            user: values.user,
          },
          request: inputs.request,
        });
      } catch {
        /* empty */
      }
    }

    await sails.helpers.actions.createOne.with({
      webhooks,
      values: {
        type: Action.Types.ADD_MEMBER_TO_TASK,
        data: {
          user: _.pick(values.user, ['id', 'name']),
          task: _.pick(values.task, ['name']),
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
