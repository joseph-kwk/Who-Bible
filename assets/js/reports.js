/**
 * Reports System
 * Allows users to flag/report questions, answers, or content issues
 */

(function() {
  'use strict';

  let currentReportContext = null;

  // Initialize the report system
  function initReportSystem() {
    const modal = document.getElementById('report-modal');
    const btnClose = document.getElementById('btn-report-close');
    const btnCancel = document.getElementById('btn-report-cancel');
    const btnSubmit = document.getElementById('btn-report-submit');
    const reportTypes = document.querySelectorAll('.report-type-btn');

    if (!modal) return;

    if (btnClose) btnClose.addEventListener('click', closeReportModal);
    if (btnCancel) btnCancel.addEventListener('click', closeReportModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeReportModal();
    });

    reportTypes.forEach(btn => {
      btn.addEventListener('click', () => {
        reportTypes.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    if (btnSubmit) btnSubmit.addEventListener('click', submitReport);

    // Direct quiz header Flag Question button
    const btnFlagHeader = document.getElementById('btn-flag-question');
    if (btnFlagHeader) {
      btnFlagHeader.addEventListener('click', (e) => {
        e.preventDefault();
        openReportModal();
      });
    } else {
      setupReportButtons();
    }
  }

  function setupReportButtons() {
    const questionText = document.getElementById('question-text');
    if (questionText && questionText.parentElement) {
      const observer = new MutationObserver(() => {
        addReportButtonToQuestion();
      });
      observer.observe(questionText.parentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  function addReportButtonToQuestion() {
    // Skip injecting floating flag if header already provides #btn-flag-question
    if (document.getElementById('btn-flag-question')) return;

    const questionText = document.getElementById('question-text');
    const answersContainer = document.getElementById('answers');
    if (!questionText || !answersContainer) return;
    if (questionText.parentElement.querySelector('.report-question-btn')) return;

    const reportBtn = document.createElement('button');
    reportBtn.className = 'report-question-btn';
    reportBtn.innerHTML = '🚩';
    reportBtn.title = 'Report this question';
    reportBtn.setAttribute('aria-label', 'Report this question');
    reportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openReportModal();
    });

    if (questionText.parentElement) {
      questionText.parentElement.style.position = 'relative';
      questionText.parentElement.appendChild(reportBtn);
    }
  }

  function openReportModal() {
    const modal = document.getElementById('report-modal');
    if (!modal) return;

    const questionText = document.getElementById('question-text');
    const answersContainer = document.getElementById('answers');

    currentReportContext = {
      question: questionText ? questionText.innerText : 'Unknown question',
      answers: [],
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    if (answersContainer) {
      const answerElements = answersContainer.querySelectorAll('.ans, .classroom-answer-btn');
      answerElements.forEach(ans => {
        const textSpan = ans.querySelector('.choice-text');
        currentReportContext.answers.push((textSpan ? textSpan.innerText : ans.innerText).trim());
      });
    }

    const contextQuestion = document.getElementById('report-context-question');
    if (contextQuestion) {
      contextQuestion.innerText = currentReportContext.question;
    }

    const reportTypes = document.querySelectorAll('.report-type-btn');
    reportTypes.forEach(btn => btn.classList.remove('selected'));

    const detailsTextarea = document.getElementById('report-details');
    if (detailsTextarea) detailsTextarea.value = '';

    modal.classList.add('show');
    if (typeof window.syncModalScrollLock === 'function') {
      window.syncModalScrollLock();
    } else {
      document.body.style.overflow = 'hidden';
    }
  }

  function closeReportModal() {
    const modal = document.getElementById('report-modal');
    if (!modal) return;

    modal.classList.remove('show');
    if (typeof window.syncModalScrollLock === 'function') {
      window.syncModalScrollLock();
    } else {
      document.body.style.overflow = '';
    }
    currentReportContext = null;
  }

  async function submitReport() {
    const selectedType = document.querySelector('.report-type-btn.selected');
    const detailsTextarea = document.getElementById('report-details');

    if (!selectedType) {
      if (typeof showToast === 'function') {
        showToast({ title: 'Selection Required', msg: 'Please select a report type', type: 'error' });
      }
      return;
    }

    const details = detailsTextarea ? detailsTextarea.value.trim() : '';

    if (details && window.ContentFilter && window.ContentFilter.validateContent) {
      const validation = window.ContentFilter.validateContent(details, {
        type: 'report',
        minLength: 0,
        maxLength: 500,
        allowUrls: false,
        allowEmails: false
      });
      if (!validation.valid) {
        if (typeof showToast === 'function') {
          showToast({ title: 'Invalid Content', msg: validation.error, type: 'error', timeout: 3000 });
        }
        return;
      }
    }

    const reportData = {
      type: selectedType.dataset.type,
      typeLabel: selectedType.innerText.replace(/^\S+\s/, ''),
      details: details,
      context: currentReportContext,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    const btnSubmit = document.getElementById('btn-report-submit');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerText = 'Submitting...';
    }

    try {
      if (typeof firebase !== 'undefined' && firebase.database) {
        await saveReportToFirebase(reportData);
      } else {
        saveReportToLocalStorage(reportData);
      }

      if (typeof showToast === 'function') {
        showToast({ title: 'Report Submitted', msg: 'Thank you for helping improve Who-Bible!', type: 'success' });
      }
      closeReportModal();
    } catch (error) {
      console.error('Error submitting report:', error);
      if (typeof showToast === 'function') {
        showToast({ title: 'Error', msg: 'Failed to submit report. Please try again.', type: 'error' });
      }
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerText = '📤 Submit Report';
      }
    }
  }

  async function saveReportToFirebase(reportData) {
    try {
      const reportsRef = firebase.database().ref('reports');
      await reportsRef.push(reportData);
    } catch (error) {
      console.error('Firebase error:', error);
      saveReportToLocalStorage(reportData);
    }
  }

  function saveReportToLocalStorage(reportData) {
    const reports = JSON.parse(localStorage.getItem('who-bible-reports') || '[]');
    reports.push({
      ...reportData,
      id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11)
    });
    localStorage.setItem('who-bible-reports', JSON.stringify(reports));
  }

  window.openReportModal = openReportModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReportSystem);
  } else {
    initReportSystem();
  }
})();
