const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';

    let projectFilter = {};
    let taskFilter = {};

    if (!isAdmin) {
      const memberProjects = await Project.find({
        $or: [{ members: req.user._id }, { owner: req.user._id }],
      }).select('_id');
      const projectIds = memberProjects.map((p) => p._id);
      projectFilter._id = { $in: projectIds };
      taskFilter.project = { $in: projectIds };
    }

    const [totalProjects, totalTasks, completedTasks, inProgressTasks, totalUsers] =
      await Promise.all([
        Project.countDocuments(projectFilter),
        Task.countDocuments(taskFilter),
        Task.countDocuments({ ...taskFilter, status: 'completed' }),
        Task.countDocuments({ ...taskFilter, status: 'in-progress' }),
        isAdmin ? User.countDocuments({ isActive: true }) : Promise.resolve(null),
      ]);

    const now = new Date();
    const overdueTasks = await Task.countDocuments({
      ...taskFilter,
      dueDate: { $lt: now },
      status: { $ne: 'completed' },
    });

    const todoTasks = await Task.countDocuments({ ...taskFilter, status: 'todo' });

    // Recent tasks
    const recentTasks = await Task.find(taskFilter)
      .sort('-createdAt')
      .limit(5)
      .populate('assignee', 'name avatar')
      .populate('project', 'title color');

    // Project progress
    const projects = await Project.find(projectFilter)
      .select('title color')
      .sort('-createdAt')
      .limit(6);

    const projectProgress = await Promise.all(
      projects.map(async (p) => {
        const total = await Task.countDocuments({ project: p._id });
        const completed = await Task.countDocuments({ project: p._id, status: 'completed' });
        return {
          id: p._id,
          title: p.title,
          color: p.color,
          total,
          completed,
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      })
    );

    // Task status breakdown for chart
    const statusBreakdown = [
      { label: 'To Do', value: todoTasks, color: '#6366F1' },
      { label: 'In Progress', value: inProgressTasks, color: '#F59E0B' },
      { label: 'Completed', value: completedTasks, color: '#10B981' },
      { label: 'Overdue', value: overdueTasks, color: '#F43F5E' },
    ];

    res.json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks,
        totalUsers,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      recentTasks,
      projectProgress,
      statusBreakdown,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats };
