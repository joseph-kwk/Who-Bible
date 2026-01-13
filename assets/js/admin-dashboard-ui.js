/**
 * Admin Dashboard UI
 * Complete admin interface for platform management
 */

import {
    isAdmin,
    getAdminUser,
    getAllUsers,
    getUserDetails,
    toggleUserBan,
    deleteUser,
    searchUsers,
    getPlatformStats,
    exportUserData
} from './admin-management.js';

import {
    getAllReports,
    getReportDetails,
    updateReportStatus,
    takeModerationAction,
    getFlaggedContent,
    getModerationStats,
    MOD_ACTIONS,
    REPORT_STATUS
} from './content-moderation.js';

import {
    getSystemHealth,
    getDatabaseStats,
    getPerformanceMetrics,
    getUsageTrends,
    getRealTimeStats,
    getTopUsers,
    getSystemAlerts,
    exportSystemReport
} from './system-health.js';

import { getText } from './translations.js';

let adminDashboard = null;
let currentView = 'overview';

/**
 * Initialize admin dashboard
 */
export async function initAdminDashboard() {
    const admin = await isAdmin();
    
    if (!admin) {
        console.log('User is not an admin');
        return false;
    }

    createAdminDashboard();
    return true;
}

/**
 * Create admin dashboard modal
 */
function createAdminDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'admin-dashboard';
    dashboard.className = 'admin-dashboard';
    dashboard.style.display = 'none';
    
    dashboard.innerHTML = `
        <div class="admin-sidebar">
            <div class="admin-header">
                <h2>🛡️ Admin</h2>
            </div>
            
            <nav class="admin-nav">
                <button class="nav-btn active" data-view="overview">
                    📊 Overview
                </button>
                <button class="nav-btn" data-view="users">
                    👥 Users
                </button>
                <button class="nav-btn" data-view="moderation">
                    🛡️ Moderation
                </button>
                <button class="nav-btn" data-view="reports">
                    🚩 Reports
                </button>
                <button class="nav-btn" data-view="system">
                    ⚙️ System
                </button>
                <button class="nav-btn" data-view="logs">
                    📝 Logs
                </button>
            </nav>
            
            <button class="close-dashboard-btn" id="close-admin-dashboard">
                ← Close
            </button>
        </div>
        
        <div class="admin-content">
            <div id="admin-view-container"></div>
        </div>
    `;
    
    document.body.appendChild(dashboard);
    adminDashboard = dashboard;
    
    attachAdminListeners();
}

/**
 * Attach admin dashboard listeners
 */
function attachAdminListeners() {
    // Navigation
    document.querySelectorAll('.admin-nav .nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
    
    // Close button
    document.getElementById('close-admin-dashboard')?.addEventListener('click', closeAdminDashboard);
}

/**
 * Open admin dashboard
 */
export async function openAdminDashboard(view = 'overview') {
    if (!await isAdmin()) {
        alert('Access denied: Admin privileges required');
        return;
    }
    
    if (adminDashboard) {
        adminDashboard.style.display = 'flex';
        await switchView(view);
    }
}

/**
 * Close admin dashboard
 */
function closeAdminDashboard() {
    if (adminDashboard) {
        adminDashboard.style.display = 'none';
    }
}

/**
 * Switch view
 */
async function switchView(view) {
    currentView = view;
    
    // Update nav
    document.querySelectorAll('.admin-nav .nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Load view content
    const container = document.getElementById('admin-view-container');
    container.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
        let content = '';
        
        switch (view) {
            case 'overview':
                content = await renderOverview();
                break;
            case 'users':
                content = await renderUsers();
                break;
            case 'moderation':
                content = await renderModeration();
                break;
            case 'reports':
                content = await renderReports();
                break;
            case 'system':
                content = await renderSystem();
                break;
            case 'logs':
                content = await renderLogs();
                break;
        }
        
        container.innerHTML = content;
        attachViewListeners(view);
    } catch (error) {
        container.innerHTML = `<div class="error">Error loading view: ${error.message}</div>`;
    }
}

/**
 * Render overview
 */
async function renderOverview() {
    const [stats, health, realTime, alerts] = await Promise.all([
        getPlatformStats(),
        getSystemHealth(),
        getRealTimeStats(),
        getSystemAlerts()
    ]);
    
    return `
        <div class="admin-view overview-view">
            <h1>Platform Overview</h1>
            
            <!-- Real-time Stats -->
            <div class="stat-cards">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-value">${stats.totalUsers}</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-card active">
                    <div class="stat-icon">🟢</div>
                    <div class="stat-value">${realTime.usersOnline}</div>
                    <div class="stat-label">Online Now</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📈</div>
                    <div class="stat-value">${stats.activeUsers24h}</div>
                    <div class="stat-label">Active 24h</div>
                </div>
                <div class="stat-card ${stats.pendingReports > 0 ? 'warning' : ''}">
                    <div class="stat-icon">🚩</div>
                    <div class="stat-value">${stats.pendingReports}</div>
                    <div class="stat-label">Pending Reports</div>
                </div>
            </div>
            
            <!-- System Health -->
            <div class="health-panel">
                <h2>System Health</h2>
                <div class="health-indicator ${health.status}">
                    <div class="health-score">${health.healthScore}</div>
                    <div class="health-status">${health.status.toUpperCase()}</div>
                </div>
                <div class="health-details">
                    <div class="health-metric">
                        <span>User Retention</span>
                        <strong>${health.metrics.users.retentionRate}%</strong>
                    </div>
                    <div class="health-metric">
                        <span>Messages Today</span>
                        <strong>${health.metrics.activity.messagesToday}</strong>
                    </div>
                    <div class="health-metric">
                        <span>Challenges Today</span>
                        <strong>${health.metrics.activity.challengesToday}</strong>
                    </div>
                </div>
            </div>
            
            <!-- Alerts -->
            ${alerts.length > 0 ? `
                <div class="alerts-panel">
                    <h2>System Alerts</h2>
                    ${alerts.map(alert => `
                        <div class="alert ${alert.level}">
                            <span class="alert-icon">${alert.level === 'critical' ? '🔴' : alert.level === 'warning' ? '⚠️' : 'ℹ️'}</span>
                            <span class="alert-message">${alert.message}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Quick Actions -->
            <div class="quick-actions">
                <h2>Quick Actions</h2>
                <button class="action-btn" onclick="window.adminUI.switchView('reports')">
                    Review Reports
                </button>
                <button class="action-btn" onclick="window.adminUI.switchView('users')">
                    Manage Users
                </button>
                <button class="action-btn" onclick="window.adminUI.exportReport()">
                    Export Report
                </button>
            </div>
        </div>
    `;
}

/**
 * Render users view
 */
async function renderUsers() {
    const users = await getAllUsers({ limitCount: 50 });
    
    return `
        <div class="admin-view users-view">
            <div class="view-header">
                <h1>User Management</h1>
                <div class="header-actions">
                    <input type="text" id="user-search" placeholder="Search users..." />
                    <button class="btn-primary" id="search-users-btn">Search</button>
                </div>
            </div>
            
            <div class="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Level</th>
                            <th>XP</th>
                            <th>Last Active</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-tbody">
                        ${users.map(user => `
                            <tr>
                                <td>
                                    <div class="user-cell">
                                        <strong>${user.displayName || 'Unknown'}</strong>
                                        <small>${user.email || ''}</small>
                                    </div>
                                </td>
                                <td>${user.level || 1}</td>
                                <td>${user.totalXP || 0}</td>
                                <td>${formatDate(user.lastActive)}</td>
                                <td>
                                    ${user.isBanned ? '<span class="status-badge banned">Banned</span>' : '<span class="status-badge active">Active</span>'}
                                </td>
                                <td>
                                    <button class="btn-small" onclick="window.adminUI.viewUser('${user.uid}')">View</button>
                                    <button class="btn-small ${user.isBanned ? '' : 'danger'}" onclick="window.adminUI.banUser('${user.uid}')">
                                        ${user.isBanned ? 'Unban' : 'Ban'}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Render moderation view
 */
async function renderModeration() {
    const [modStats, flaggedContent] = await Promise.all([
        getModerationStats(),
        getFlaggedContent(20)
    ]);
    
    return `
        <div class="admin-view moderation-view">
            <h1>Content Moderation</h1>
            
            <div class="mod-stats">
                <div class="stat-card">
                    <div class="stat-value">${modStats.pendingReports}</div>
                    <div class="stat-label">Pending Reports</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${modStats.resolvedThisWeek}</div>
                    <div class="stat-label">Resolved This Week</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${modStats.flaggedContent}</div>
                    <div class="stat-label">Flagged Content</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${modStats.bannedUsers}</div>
                    <div class="stat-label">Banned Users</div>
                </div>
            </div>
            
            <div class="flagged-content">
                <h2>Flagged Content</h2>
                ${flaggedContent.length > 0 ? `
                    <div class="content-list">
                        ${flaggedContent.map(content => `
                            <div class="content-item">
                                <div class="content-header">
                                    <strong>${content.authorInfo.displayName}</strong>
                                    <span class="report-count">${content.reportCount} reports</span>
                                </div>
                                <div class="content-text">${content.message}</div>
                                <div class="content-actions">
                                    <button class="btn-small" onclick="window.adminUI.deleteMessage('${content.id}')">Delete</button>
                                    <button class="btn-small danger" onclick="window.adminUI.banUser('${content.authorId}')">Ban Author</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="empty">No flagged content</p>'}
            </div>
        </div>
    `;
}

/**
 * Render reports view
 */
async function renderReports() {
    const reports = await getAllReports({ status: REPORT_STATUS.PENDING, limitCount: 30 });
    
    return `
        <div class="admin-view reports-view">
            <h1>Reports Queue</h1>
            
            <div class="reports-list">
                ${reports.length > 0 ? reports.map(report => `
                    <div class="report-card">
                        <div class="report-header">
                            <span class="report-type">${report.type}</span>
                            <span class="report-date">${formatDate(report.createdAt)}</span>
                        </div>
                        <div class="report-body">
                            <p><strong>Reporter:</strong> ${report.reporterInfo.displayName}</p>
                            ${report.reportedUserInfo ? `<p><strong>Reported:</strong> ${report.reportedUserInfo.displayName}</p>` : ''}
                            <p><strong>Reason:</strong> ${report.reason || 'No reason provided'}</p>
                        </div>
                        <div class="report-actions">
                            <button class="btn-small" onclick="window.adminUI.viewReport('${report.id}')">Review</button>
                            <button class="btn-small success" onclick="window.adminUI.resolveReport('${report.id}')">Resolve</button>
                            <button class="btn-small" onclick="window.adminUI.dismissReport('${report.id}')">Dismiss</button>
                        </div>
                    </div>
                `).join('') : '<p class="empty">No pending reports</p>'}
            </div>
        </div>
    `;
}

/**
 * Render system view
 */
async function renderSystem() {
    const [health, dbStats, performance, topUsers] = await Promise.all([
        getSystemHealth(),
        getDatabaseStats(),
        getPerformanceMetrics(),
        getTopUsers(10)
    ]);
    
    return `
        <div class="admin-view system-view">
            <h1>System Health</h1>
            
            <div class="system-panels">
                <div class="system-panel">
                    <h2>Database</h2>
                    <div class="db-stats">
                        <p>Total Documents: <strong>${dbStats.totalDocuments}</strong></p>
                        <p>Estimated Size: <strong>${dbStats.estimatedSizeMB} MB</strong></p>
                        <p>Users: <strong>${dbStats.collections.users}</strong></p>
                        <p>Messages: <strong>${dbStats.collections.messages}</strong></p>
                        <p>Challenges: <strong>${dbStats.collections.challenges}</strong></p>
                    </div>
                </div>
                
                <div class="system-panel">
                    <h2>Performance</h2>
                    <div class="perf-stats">
                        <p>Page Load: <strong>${(performance.pageLoadTime / 1000).toFixed(2)}s</strong></p>
                        <p>DOM Loaded: <strong>${(performance.domContentLoaded / 1000).toFixed(2)}s</strong></p>
                        ${performance.memory ? `
                            <p>JS Heap: <strong>${performance.memory.usedJSHeapSize}</strong></p>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="top-users">
                <h2>Top Users by XP</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>User</th>
                            <th>Level</th>
                            <th>XP</th>
                            <th>Accuracy</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topUsers.map((user, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${user.displayName}</td>
                                <td>${user.level}</td>
                                <td>${user.totalXP}</td>
                                <td>${user.accuracy}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="system-actions">
                <button class="btn-primary" onclick="window.adminUI.exportReport()">
                    Export System Report
                </button>
            </div>
        </div>
    `;
}

/**
 * Render logs view
 */
async function renderLogs() {
    return `
        <div class="admin-view logs-view">
            <h1>Activity Logs</h1>
            <p class="empty">Logs view coming soon...</p>
        </div>
    `;
}

/**
 * Attach view-specific listeners
 */
function attachViewListeners(view) {
    if (view === 'users') {
        document.getElementById('search-users-btn')?.addEventListener('click', async () => {
            const searchTerm = document.getElementById('user-search').value;
            if (searchTerm) {
                const results = await searchUsers(searchTerm);
                // Update table with results
                const tbody = document.getElementById('users-tbody');
                tbody.innerHTML = results.map(user => `
                    <tr>
                        <td>
                            <div class="user-cell">
                                <strong>${user.displayName || 'Unknown'}</strong>
                                <small>${user.email || ''}</small>
                            </div>
                        </td>
                        <td>${user.level || 1}</td>
                        <td>${user.totalXP || 0}</td>
                        <td>${formatDate(user.lastActive)}</td>
                        <td>
                            ${user.isBanned ? '<span class="status-badge banned">Banned</span>' : '<span class="status-badge active">Active</span>'}
                        </td>
                        <td>
                            <button class="btn-small" onclick="window.adminUI.viewUser('${user.uid}')">View</button>
                            <button class="btn-small ${user.isBanned ? '' : 'danger'}" onclick="window.adminUI.banUser('${user.uid}')">
                                ${user.isBanned ? 'Unban' : 'Ban'}
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        });
    }
}

/**
 * Utility: Format date
 */
function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Export to window for inline onclick handlers
 */
window.adminUI = {
    switchView,
    viewUser: async (uid) => {
        const details = await getUserDetails(uid);
        alert(`User: ${details.displayName}\nLevel: ${details.level}\nXP: ${details.totalXP}`);
    },
    banUser: async (uid) => {
        if (confirm('Ban this user?')) {
            const reason = prompt('Reason for ban:');
            await toggleUserBan(uid, reason);
            switchView(currentView);
        }
    },
    deleteMessage: async (messageId) => {
        if (confirm('Delete this message?')) {
            await takeModerationAction(messageId, MOD_ACTIONS.DELETE_MESSAGE);
            switchView(currentView);
        }
    },
    viewReport: async (reportId) => {
        const report = await getReportDetails(reportId);
        alert(`Report: ${report.type}\nReason: ${report.reason}`);
    },
    resolveReport: async (reportId) => {
        await updateReportStatus(reportId, REPORT_STATUS.RESOLVED);
        switchView(currentView);
    },
    dismissReport: async (reportId) => {
        await updateReportStatus(reportId, REPORT_STATUS.DISMISSED);
        switchView(currentView);
    },
    exportReport: async () => {
        await exportSystemReport();
    }
};
