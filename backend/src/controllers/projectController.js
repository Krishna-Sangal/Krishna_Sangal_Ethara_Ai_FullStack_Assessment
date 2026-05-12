const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// @desc    Get all projects (admin: all, member: joined)
// @route   GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ owner: req.user._id }, { members: req.user._id }] };
    const projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort('-createdAt');
    // Attach task counts
    const projectsWithCount = await Promise.all(
      projects.map(async (p) => {
        const taskCount = await Task.countDocuments({ project: p._id });
        const completedCount = await Task.countDocuments({ project: p._id, status: 'completed' });
        return { ...p.toJSON(), taskCount, completedCount };
      })
    );
    res.json({ success: true, projects: projectsWithCount });
  } catch (err) {
    next(err);
  }
};

// @desc    Create project (admin only)
// @route   POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { title, description, color, dueDate, members } = req.body;
    const project = await Project.create({
      title,
      description,
      color: color || '#6366F1',
      dueDate,
      owner: req.user._id,
      members: members || [],
    });
    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');
    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    // Check access
    if (
      req.user.role !== 'admin' &&
      !project.members.some((m) => m._id.equals(req.user._id)) &&
      !project.owner._id.equals(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project (admin only)
// @route   PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project (admin only)
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ success: true, message: 'Project and all tasks deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Add member to project (admin only)
// @route   POST /api/projects/:id/members
const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }
    project.members.push(userId);
    await project.save();
    await project.populate('members', 'name email avatar');
    await Notification.create({
      user: userId,
      message: `You have been added to project "${project.title}"`,
      type: 'project_invite',
      relatedProject: project._id,
    });
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove member from project (admin only)
// @route   DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    project.members = project.members.filter((m) => !m.equals(req.params.userId));
    await project.save();
    await project.populate('members', 'name email avatar');
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
