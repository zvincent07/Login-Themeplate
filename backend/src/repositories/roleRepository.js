/**
 * ROLE REPOSITORY
 * 
 * Rules:
 * - Repositories return plain objects only
 * - No business logic here
 * - Only database access
 */

const Role = require('../models/Role');

class RoleRepository {
  /**
   * Find role by ID
   */
  async findById(id) {
    const role = await Role.findById(id);
    return role ? role.toObject() : null;
  }

  /**
   * Find role by name (case-insensitive)
   */
  async findByName(name) {
    const role = await Role.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });
    return role ? role.toObject() : null;
  }

  /**
   * Find all roles
   */
  async findAll() {
    const roles = await Role.find().lean();
    return roles;
  }

  /**
   * Create role
   */
  async create(roleData) {
    const role = await Role.create(roleData);
    return role.toObject();
  }

  /**
   * Update role by ID
   */
  async updateById(id, updateData) {
    const role = await Role.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    return role ? role.toObject() : null;
  }

  /**
   * Delete role by ID
   */
  async deleteById(id) {
    const role = await Role.findByIdAndDelete(id);
    return role ? role.toObject() : null;
  }
}

module.exports = new RoleRepository();
