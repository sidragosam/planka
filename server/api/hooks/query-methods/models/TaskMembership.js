/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => TaskMembership.find(criteria).sort('id');

/* Query methods */

const create = (arrayOfValues) => TaskMembership.createEach(arrayOfValues).fetch();

const createOne = (values) => TaskMembership.create({ ...values }).fetch();

const getByIds = (ids) => defaultFind(ids);

const getOneById = (id) =>
  TaskMembership.findOne({
    id,
  });

const getByTaskId = (taskId) =>
  defaultFind({
    taskId,
  });

const getByTaskIds = (taskIds) =>
  defaultFind({
    taskId: taskIds,
  });

const getOneByTaskIdAndUserId = (taskId, userId) =>
  TaskMembership.findOne({
    taskId,
    userId,
  });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => TaskMembership.destroy(criteria).fetch();

const deleteOne = (criteria) => TaskMembership.destroyOne(criteria);

module.exports = {
  create,
  createOne,
  getByIds,
  getOneById,
  getByTaskId,
  getByTaskIds,
  getOneByTaskIdAndUserId,
  deleteOne,
  delete: delete_,
};
