/**
 * PERMISSION REPOSITORY
 * 
 * Rules:
 * - Repositories return plain objects only
 * - No business logic here
 * - Only database access
 */

const Permission = require('../models/Permission');

class PermissionRepository {
  /**
   * Find permission by ID
   */
  async findById(id) {
    const permission = await Permission.findById(id);
    return permission ? permission.toObject() : null;
  }

  /**
   * Find permission by name
   */
  async findByName(name) {
    const permission = await Permission.findOne({ name });
    return permission ? permission.toObject() : null;
  }

  /**
   * Find permission by resource and action
   */
  async findByResourceAndAction(resource, action) {
    const permission = await Permission.findOne({ resource, action });
    return permission ? permission.toObject() : null;
  }

  /**
   * Find all permissions
   */
  async findAll(filters = {}) {
    const query = {};

    if (filters.resource) {
      query.resource = filters.resource;
    }

    if (filters.action) {
      query.action = filters.action;
    }

    const permissions = await Permission.find(query).lean();
    return permissions;
  }

  /**
   * Create permission
   */
  async create(permissionData) {
    const permission = await Permission.create(permissionData);
    return permission.toObject();
  }

  /**
   * Create multiple permissions
   */
  async createMany(permissionsData) {
    const permissions = await Permission.insertMany(permissionsData);
    return permissions.map(p => p.toObject());
  }

  /**
   * Update permission by ID
   */
  async updateById(id, updateData) {
    const permission = await Permission.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    return permission ? permission.toObject() : null;
  }

  /**
   * Delete permission by ID
   */
  async deleteById(id) {
    const permission = await Permission.findByIdAndDelete(id);
    return permission ? permission.toObject() : null;
  }

  /**
   * Find permissions by IDs
   */
  async findByIds(ids) {
    const permissions = await Permission.find({ _id: { $in: ids } }).lean();
    return permissions;
  }
}

module.exports = new PermissionRepository();
