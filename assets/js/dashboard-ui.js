/**
 * Analytics Dashboard UI
 * Displays comprehensive user analytics and insights
 */

import { getUserAnalytics, exportAnalyticsData } from './analytics.js';
import { getText } from './translations.js';
import { 
    createLineChart, 
    createBarChart, 
    createPieChart, 
    createProgressRing 
} from './charts.js';

let currentTimeRange = 'month';
let analyticsData = null;

/**
 * Initialize dashboard
 */
export async function initDashboard() {
    await loadDashboardData();
    setupDashboardListeners();
}

/**
 * Load and display dashboard data
 */
async function loadDashboardData(timeRange = 'month') {
    currentTimeRange = timeRange;
    showLoading();

    try {
        analyticsData = await getUserAnalytics(timeRange);
        
        if (!analyticsData) {
            showEmptyState();
            return;
        }

        renderDashboard();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load analytics data');
    }
}

/**
 * Render complete dashboard
 */
function renderDashboard() {
    renderOverview();
    renderInsights();
    renderCharts();
    renderPersonalRecords();
    renderModePerformance();
}

/**
 * Render overview stats
 */
function renderOverview() {
    const overview = analyticsData.overview;
    const container = document.getElementById('stats-overview');
    
    if (!container) return;

    container.innerHTML = `
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-icon">🎮</div>
                <div class="stat-value">${overview.totalGames}</div>
                <div class="stat-label">${getText('analytics.totalGames')}</div>
                <div class="stat-sublabel">${overview.gamesThisWeek} ${getText('analytics.thisWeek')}</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-value">${overview.totalQuestions.toLocaleString()}</div>
                <div class="stat-label">${getText('analytics.questionsAnswered')}</div>
            </div>

            <div class="stat-card ${overview.accuracyTrend === 'up' ? 'trend-up' : 'trend-down'}">
                <div class="stat-icon">🎯</div>
                <div class="stat-value">${overview.overallAccuracy.toFixed(1)}%</div>
                <div class="stat-label">${getText('analytics.accuracy')}</div>
                <div class="stat-sublabel">
                    ${overview.accuracyTrend === 'up' ? '📈' : '📉'} 
                    ${getText('analytics.recent')}: ${overview.recentAccuracy}%
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">⚡</div>
                <div class="stat-value">${overview.currentStreak}</div>
                <div class="stat-label">${getText('analytics.currentStreak')}</div>
                <div class="stat-sublabel">${getText('analytics.longest')}: ${overview.longestStreak}</div>
            </div>

            <div class="stat-card level-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-value">${getText('auth.level')} ${overview.currentLevel}</div>
                <div class="stat-label">${overview.totalXP.toLocaleString()} XP</div>
                <div class="level-progress">
                    <canvas id="level-progress-ring" width="100" height="100"></canvas>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">⏱️</div>
                <div class="stat-value">${formatTime(overview.totalTimeSpent)}</div>
                <div class="stat-label">${getText('analytics.timeSpent')}</div>
                <div class="stat-sublabel">${getText('analytics.avgPerGame')}: ${formatTime(overview.avgTimePerGame)}</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">💯</div>
                <div class="stat-value">${overview.perfectGames}</div>
                <div class="stat-label">${getText('analytics.perfectGames')}</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-value">${overview.gamesThisMonth}</div>
                <div class="stat-label">${getText('analytics.thisMonth')}</div>
            </div>
        </div>
    `;

    // Render level progress ring
    const xpForNextLevel = getXPForNextLevel(overview.currentLevel);
    const currentLevelXP = overview.totalXP % xpForNextLevel;
    setTimeout(() => {
        createProgressRing('level-progress-ring', currentLevelXP, xpForNextLevel, {
            color: '#DCDCAA',
            showValue: false
        });
    }, 100);
}

/**
 * Render learning insights
 */
function renderInsights() {
    const insights = analyticsData.insights;
    const container = document.getElementById('learning-insights');
    
    if (!container) return;

    if (insights.length === 0) {
        container.innerHTML = `
            <div class="empty-insights">
                <p>${getText('analytics.noInsights')}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = insights.map(insight => `
        <div class="insight-card insight-${insight.type}">
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-content">
                <div class="insight-category">${getText(`analytics.${insight.category}`)}</div>
                <div class="insight-message">${insight.message}</div>
            </div>
        </div>
    `).join('');
}

/**
 * Render charts
 */
function renderCharts() {
    // Accuracy trend chart
    const accuracyData = analyticsData.accuracyTrend.map(point => ({
        label: new Date(point.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        value: point.movingAverage
    }));

    setTimeout(() => {
        createLineChart('accuracy-chart', accuracyData, {
            color: '#4EC9B0',
            smooth: true
        });
    }, 100);

    // Daily activity chart
    const activityData = analyticsData.trends.daily.slice(-14).map(day => ({
        label: new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        value: day.gamesPlayed
    }));

    setTimeout(() => {
        createBarChart('activity-chart', activityData, {
            color: '#569CD6'
        });
    }, 100);

    // XP trend chart
    const xpData = analyticsData.trends.daily.slice(-14).map(day => ({
        label: new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        value: day.xpEarned
    }));

    setTimeout(() => {
        createLineChart('xp-chart', xpData, {
            color: '#DCDCAA',
            fillColor: 'rgba(220, 220, 170, 0.1)'
        });
    }, 100);
}

/**
 * Render personal records
 */
function renderPersonalRecords() {
    const records = analyticsData.records;
    const container = document.getElementById('personal-records');
    
    if (!container) return;

    container.innerHTML = `
        <div class="records-grid">
            <div class="record-card">
                <div class="record-icon">🏆</div>
                <div class="record-value">${records.highestScore.value}</div>
                <div class="record-label">${getText('analytics.highestScore')}</div>
                <div class="record-date">${formatDate(records.highestScore.date)}</div>
            </div>

            <div class="record-card">
                <div class="record-icon">🎯</div>
                <div class="record-value">100%</div>
                <div class="record-label">${getText('analytics.perfectGame')}</div>
                <div class="record-sublabel">${records.bestAccuracy.questions} ${getText('analytics.questions')}</div>
            </div>

            <div class="record-card">
                <div class="record-icon">📚</div>
                <div class="record-value">${records.mostQuestionsInGame.value}</div>
                <div class="record-label">${getText('analytics.mostQuestions')}</div>
                <div class="record-date">${formatDate(records.mostQuestionsInGame.date)}</div>
            </div>

            <div class="record-card">
                <div class="record-icon">⚡</div>
                <div class="record-value">${records.mostXPInGame.value}</div>
                <div class="record-label">${getText('analytics.mostXP')}</div>
                <div class="record-date">${formatDate(records.mostXPInGame.date)}</div>
            </div>

            ${records.fastestPerfectGame ? `
                <div class="record-card">
                    <div class="record-icon">⏱️</div>
                    <div class="record-value">${formatTime(Math.floor(records.fastestPerfectGame.duration / 1000))}</div>
                    <div class="record-label">${getText('analytics.fastestPerfect')}</div>
                    <div class="record-date">${formatDate(records.fastestPerfectGame.date)}</div>
                </div>
            ` : ''}

            <div class="record-card">
                <div class="record-icon">🔥</div>
                <div class="record-value">${records.mostGamesInDay.value}</div>
                <div class="record-label">${getText('analytics.gamesInOneDay')}</div>
                <div class="record-date">${formatDate(new Date(records.mostGamesInDay.date))}</div>
            </div>

            ${records.bestWeek ? `
                <div class="record-card">
                    <div class="record-icon">📅</div>
                    <div class="record-value">${records.bestWeek.xp} XP</div>
                    <div class="record-label">${getText('analytics.bestWeek')}</div>
                    <div class="record-sublabel">${records.bestWeek.week}</div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Render mode performance breakdown
 */
function renderModePerformance() {
    const modePerf = analyticsData.modePerformance;
    const container = document.getElementById('mode-performance');
    
    if (!container) return;

    const modes = Object.entries(modePerf).sort((a, b) => b[1].gamesPlayed - a[1].gamesPlayed);

    container.innerHTML = `
        <div class="mode-performance-grid">
            ${modes.map(([mode, stats]) => `
                <div class="mode-card">
                    <div class="mode-header">
                        <span class="mode-name">${formatModeName(mode)}</span>
                        <span class="mode-games">${stats.gamesPlayed} ${getText('analytics.games')}</span>
                    </div>
                    <div class="mode-stats">
                        <div class="mode-stat">
                            <span class="mode-stat-label">${getText('analytics.accuracy')}</span>
                            <span class="mode-stat-value">${stats.avgAccuracy.toFixed(1)}%</span>
                        </div>
                        <div class="mode-stat">
                            <span class="mode-stat-label">${getText('analytics.avgXP')}</span>
                            <span class="mode-stat-value">${stats.avgXPPerGame.toFixed(0)}</span>
                        </div>
                        <div class="mode-stat">
                            <span class="mode-stat-label">${getText('analytics.perfect')}</span>
                            <span class="mode-stat-value">${stats.perfectGames}</span>
                        </div>
                    </div>
                    <div class="mode-progress-bar">
                        <div class="mode-progress-fill" style="width: ${stats.avgAccuracy}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="mode-chart-container">
            <h4>${getText('analytics.gamesByMode')}</h4>
            <canvas id="mode-distribution-chart" width="400" height="300"></canvas>
        </div>
    `;

    // Render pie chart
    const pieData = modes.map(([mode, stats]) => ({
        label: formatModeName(mode),
        value: stats.gamesPlayed
    }));

    setTimeout(() => {
        createPieChart('mode-distribution-chart', pieData, {
            donut: true,
            showLegend: true
        });
    }, 100);
}

/**
 * Show dashboard modal
 */
export function showDashboard() {
    const modal = document.getElementById('dashboard-modal');
    if (!modal) {
        createDashboardModal();
    }
    
    document.getElementById('dashboard-modal').style.display = 'flex';
    loadDashboardData(currentTimeRange);
}

/**
 * Close dashboard
 */
function closeDashboard() {
    document.getElementById('dashboard-modal').style.display = 'none';
}

/**
 * Create dashboard modal HTML
 */
function createDashboardModal() {
    const modalHTML = `
        <div id="dashboard-modal" class="modal dashboard-modal" style="display: none;">
            <div class="modal-content dashboard-content">
                <div class="dashboard-header">
                    <h2>📊 ${getText('analytics.dashboard')}</h2>
                    <div class="dashboard-controls">
                        <select id="time-range-select" class="time-range-select">
                            <option value="week">${getText('analytics.lastWeek')}</option>
                            <option value="month" selected>${getText('analytics.lastMonth')}</option>
                            <option value="3months">${getText('analytics.last3Months')}</option>
                            <option value="year">${getText('analytics.lastYear')}</option>
                            <option value="all">${getText('analytics.allTime')}</option>
                        </select>
                        <button id="export-analytics-btn" class="export-btn" title="${getText('analytics.export')}">
                            📥 ${getText('analytics.export')}
                        </button>
                        <span class="close-modal" id="close-dashboard">&times;</span>
                    </div>
                </div>

                <div class="dashboard-body">
                    <!-- Loading State -->
                    <div id="dashboard-loading" class="dashboard-loading">
                        <div class="spinner"></div>
                        <p>${getText('analytics.loading')}</p>
                    </div>

                    <!-- Overview Stats -->
                    <section class="dashboard-section">
                        <h3>${getText('analytics.overview')}</h3>
                        <div id="stats-overview"></div>
                    </section>

                    <!-- Learning Insights -->
                    <section class="dashboard-section">
                        <h3>${getText('analytics.insights')}</h3>
                        <div id="learning-insights"></div>
                    </section>

                    <!-- Charts -->
                    <section class="dashboard-section">
                        <h3>${getText('analytics.trends')}</h3>
                        <div class="charts-grid">
                            <div class="chart-card">
                                <h4>${getText('analytics.accuracyTrend')}</h4>
                                <canvas id="accuracy-chart" width="600" height="300"></canvas>
                            </div>
                            <div class="chart-card">
                                <h4>${getText('analytics.dailyActivity')}</h4>
                                <canvas id="activity-chart" width="600" height="300"></canvas>
                            </div>
                            <div class="chart-card">
                                <h4>${getText('analytics.xpEarned')}</h4>
                                <canvas id="xp-chart" width="600" height="300"></canvas>
                            </div>
                        </div>
                    </section>

                    <!-- Personal Records -->
                    <section class="dashboard-section">
                        <h3>🏆 ${getText('analytics.personalRecords')}</h3>
                        <div id="personal-records"></div>
                    </section>

                    <!-- Mode Performance -->
                    <section class="dashboard-section">
                        <h3>${getText('analytics.modePerformance')}</h3>
                        <div id="mode-performance"></div>
                    </section>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Setup event listeners
 */
function setupDashboardListeners() {
    document.getElementById('close-dashboard')?.addEventListener('click', closeDashboard);
    
    document.getElementById('dashboard-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'dashboard-modal') closeDashboard();
    });

    document.getElementById('time-range-select')?.addEventListener('change', (e) => {
        loadDashboardData(e.target.value);
    });

    document.getElementById('export-analytics-btn')?.addEventListener('click', () => {
        exportAnalyticsData(currentTimeRange);
    });
}

// UI Helper functions

function showLoading() {
    const loading = document.getElementById('dashboard-loading');
    const body = document.querySelector('.dashboard-body');
    if (loading) loading.style.display = 'flex';
    if (body) body.classList.add('loading');
}

function hideLoading() {
    const loading = document.getElementById('dashboard-loading');
    const body = document.querySelector('.dashboard-body');
    if (loading) loading.style.display = 'none';
    if (body) body.classList.remove('loading');
}

function showEmptyState() {
    hideLoading();
    const body = document.querySelector('.dashboard-body');
    if (body) {
        body.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>${getText('analytics.noData')}</h3>
                <p>${getText('analytics.playGamesToSeeStats')}</p>
            </div>
        `;
    }
}

function showError(message) {
    hideLoading();
    const body = document.querySelector('.dashboard-body');
    if (body) {
        body.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>${getText('analytics.error')}</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

function formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
}

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatModeName(mode) {
    const names = {
        'solo': getText('soloMode'),
        'timed': getText('timedMode'),
        'challenge': getText('challengeMode'),
        'scenario': getText('scenariosMode'),
        'relationship': 'Relationship Mode',
        'advanced': 'Advanced Mode'
    };
    return names[mode] || mode;
}

function getXPForNextLevel(currentLevel) {
    return 100 * (currentLevel + 1) + 50 * currentLevel;
}

// Initialize when auth state changes
window.addEventListener('auth:login', () => {
    setTimeout(() => initDashboard(), 500);
});
