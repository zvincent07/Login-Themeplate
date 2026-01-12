import api from './api';
import { API_ENDPOINTS } from '../config/api';

const auditLogService = {
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams();

    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.resourceType && params.resourceType !== 'all') {
      query.append('resourceType', params.resourceType);
    }
    if (params.action && params.action !== 'all') {
      query.append('action', params.action);
    }
    if (params.actorEmail) query.append('actorEmail', params.actorEmail);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);

    const qs = query.toString();
    const endpoint = qs
      ? `${API_ENDPOINTS.auditLogs}?${qs}`
      : API_ENDPOINTS.auditLogs;

    return await api.get(endpoint);
  },
};

export default auditLogService;

