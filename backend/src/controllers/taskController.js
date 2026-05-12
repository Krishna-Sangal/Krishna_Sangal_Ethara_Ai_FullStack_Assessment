const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// @desc    Get tasks (with filters)
// @route   GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, assignee, search } = req.query;
    let filter = {};

    if (req.user.role === 'member') {
      // Members see tasks in their projects or assigned to them
      const memberProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = memberProjects.map((p) => p._id);
      filter.$or = [{ assignee: req.user._id }, { project: { $in: projectIds } }];
    }

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'title color')
      .sort({ order: 1, createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
};

// @desc    Create task (admin only)
// @route   POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignee, priority, dueDate, tags } = req.body;

    // Verify project exists
    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });

    const task = await Task.create({
      title,
      description,
      project,
      assignee: assignee || null,
      createdBy: req.user._id,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
    });

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'title color');

    // Notify assignee
    if (assignee && assignee !== req.user._id.toString()) {
      await Notification.create({
        user: assignee,
        message: `You have been assigned a new task: "${title}"`,
        type: 'task_assigned',
        relatedTask: task._id,
        relatedProject: project,
      });
    }

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'title color')
      .populate('comments.author', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task (admin full, member: status only)
// @route   PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Members can only update status
    if (req.user.role === 'member') {
      const { status } = req.body;
      if (!status) {
        return res.status(403).json({ success: false, message: 'Members can only update task status' });
      }
      task.status = status;
      await task.save();
      // Notify task creator if status changed
      if (task.createdBy && !task.createdBy.equals(req.user._id)) {
        await Notification.create({
          user: task.createdBy,
          message: `Task "${task.title}" status changed to ${status}`,
          type: 'task_updated',
          relatedTask: task._id,
        });
      }
    } else {
      // Admin can update all fields
      const { title, description, assignee, priority, dueDate, status, tags, order } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignee !== undefined) task.assignee = assignee || null;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
      if (status) task.status = status;
      if (tags) task.tags = tags;
      if (order !== undefined) task.order = order;
      await task.save();
    }

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'title color');
    await task.populate('comments.author', 'name email avatar');

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete task (admin only)
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.comments.push({ author: req.user._id, text });
    await task.save();
    await task.populate('comments.author', 'name email avatar');

    // Notify task assignee
    if (task.assignee && !task.assignee.equals(req.user._id)) {
      await Notification.create({
        user: task.assignee,
        message: `${req.user.name} commented on task "${task.title}"`,
        type: 'comment_added',
        relatedTask: task._id,
      });
    }

    const lastComment = task.comments[task.comments.length - 1];
    res.status(201).json({ success: true, comment: lastComment });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk reorder tasks (for drag-and-drop)
// @route   PUT /api/tasks/reorder
const reorderTasks = async (req, res, next) => {
  try {
    const { tasks } = req.body; // [{id, order, status}]
    const updates = tasks.map(({ id, order, status }) =>
      Task.findByIdAndUpdate(id, { order, status })
    );
    await Promise.all(updates);
    res.json({ success: true, message: 'Tasks reordered' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, addComment, reorderTasks };
