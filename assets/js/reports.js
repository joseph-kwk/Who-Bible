/**
 * Reports System
 * Allows users to flag/report questions, answers, or content issues
 */

(function() {
  'use strict';

  let currentReportContext = null;

  // Initialize the report system
  function initReportSystem() {
    console.log('Initializing report system...');

    const modal = document.getElementById('report-modal');
    const btnClose = document.getElementById('btn-report-close');
    const btnCancel = document.getElementById('btn-report-cancel');
    const btnSubmit = document.getElementById('btn-report-submit');
    const reportTypes = document.querySelectorAll('.report-type-btn');

    if (!modal) {
      console.warn('Report modal not found');
      return;
    }

    // Close modal handlers
    if (btnClose) {
      btnClose.addEventListener('click', closeReportModal);
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', closeReportModal);
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeReportModal();
      }
    });

    // Report type selection
    reportTypes.forEach(btn => {
      btn.addEventListener('click', () => {
        reportTypes.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Submit report
    if (btnSubmit) {
      btnSubmit.addEventListener('click', submitReport);
    }

    // Setup report buttons for questions (these will be added dynamically)
    setupReportButtons();
  }

  // Setup report buttons in the quiz interface
  function setupReportButtons() {
    // This will be called after questions are rendered
    // We'll add a MutationObserver to watch for new questions
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

  // Add report button next to the question
  function addReportButtonToQuestion() {
    const questionText = document.getElementById('question-text');
    const answersContainer = document.getElementById('answers');
    
    if (!questionText || !answersContainer) return;

    // Check if button already exists
    if (questionText.parentElement.querySelector('.report-question-btn')) {
      return;
    }

    // Create report button
    const reportBtn = document.createElement('button');
    reportBtn.className = 'report-question-btn';
    reportBtn.innerHTML = '🚩';
    reportBtn.title = 'Report this question';
    reportBtn.setAttribute('aria-label', 'Report this question');
    reportBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--bg-2);
      border: 2px solid var(--border);
      border-radius: 8px;
      width: 36px;
      height: 36px;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    `;

    reportBtn.addEventListener('mouseenter', () => {
      reportBtn.style.background = 'var(--accent)';
      reportBtn.style.borderColor = 'var(--accent)';
      reportBtn.style.transform = 'scale(1.1)';
    });

    reportBtn.addEventListener('mouseleave', () => {
      reportBtn.style.background = 'var(--bg-2)';
      reportBtn.style.borderColor = 'var(--border)';
      reportBtn.style.transform = 'scale(1)';
    });

    reportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openReportModal();
    });

    // Make question container relative for positioning
    if (questionText.parentElement) {
      questionText.parentElement.style.position = 'relative';
      questionText.parentElement.appendChild(reportBtn);
    }
  }

  // Open the report modal
  function openReportModal() {
    const modal = document.getElementById('report-modal');
    if (!modal) return;

    // Capture current question context
    const questionText = document.getElementById('question-text');
    const answersContainer = document.getElementById('answers');
    
    currentReportContext = {
      question: questionText ? questionText.innerText : 'Unknown question',
      answers: [],
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Capture answer choices
    if (answersContainer) {
      const answerElements = answersContainer.querySelectorAll('.ans');
      answerElements.forEach(ans => {
        currentReportContext.answers.push(ans.innerText);
      });
    }

    // Update modal with context
    const contextQuestion = document.getElementById('report-context-question');
    if (contextQuestion) {
      contextQuestion.innerText = currentReportContext.question;
    }

    // Reset form
    const reportTypes = document.querySelectorAll('.report-type-btn');
    reportTypes.forEach(btn => btn.classList.remove('selected'));
    
    const detailsTextarea = document.getElementById('report-details');
    if (detailsTextarea) {
      detailsTextarea.value = '';
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  // Close the report modal
  function closeReportModal() {
    const modal = document.getElementById('report-modal');
    if (!modal) return;

    modal.classList.remove('show');
    document.body.style.overflow = '';
    currentReportContext = null;
  }

  // Submit the report
  async function submitReport() {
    const selectedType = document.querySelector('.report-type-btn.selected');
    const detailsTextarea = document.getElementById('report-details');
    
    if (!selectedType) {
      showToast({
        title: 'Selection Required',
        msg: 'Please select a report type',
        type: 'error'
      });
      return;
    }
    
    const details = detailsTextarea ? detailsTextarea.value.trim() : '';
    
    // Validate report details if ContentFilter is available
    if (details && window.ContentFilter && window.ContentFilter.validateContent) {
      const validation = window.ContentFilter.validateContent(details, {
        type: 'report',
        minLength: 0,
        maxLength: 500,
        allowUrls: false,
        allowEmails: false
      });
      if (!validation.valid) {
        showToast({
          title: 'Invalid Content',
          msg: validation.error,
          type: 'error',
          timeout: 3000
        });
        return;
      }
    }

    const reportData = {
      type: selectedType.dataset.type,
      typeLabel: selectedType.innerText.replace(/^\S+\s/, ''), // Remove emoji
      details: details,
      context: currentReportContext,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Disable submit button
    const btnSubmit = document.getElementById('btn-report-submit');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerText = 'Submitting...';
    }

    try {
      // Check if Firebase is available
      if (typeof firebase !== 'undefined' && firebase.database) {
        await saveReportToFirebase(reportData);
      } else {
        // Fallback to localStorage if Firebase is not available
        saveReportToLocalStorage(reportData);
      }

      showToast({
        title: 'Report Submitted',
        msg: 'Thank you for helping improve Who-Bible!',
        type: 'success'
      });

      closeReportModal();
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast({
        title: 'Error',
        msg: 'Failed to submit report. Please try again.',
        type: 'error'
      });
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerText = '📤 Submit Report';
      }
    }
  }

  // Save report to Firebase
  async function saveReportToFirebase(reportData) {
    try {
      const reportsRef = firebase.database().ref('reports');
      await reportsRef.push(reportData);
      console.log('Report saved to Firebase');
    } catch (error) {
      console.error('Firebase error:', error);
      // Fallback to localStorage
      saveReportToLocalStorage(reportData);
    }
  }

  // Save report to localStorage (fallback)
  function saveReportToLocalStorage(reportData) {
    try {
      const reports = JSON.parse(localStorage.getItem('who-bible-reports') || '[]');
      reports.push({
        ...reportData,
        id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
      });
      localStorage.setItem('who-bible-reports', JSON.stringify(reports));
      console.log('Report saved to localStorage');
    } catch (error) {
      console.error('localStorage error:', error);
      throw error;
    }
  }

  // Expose the openReportModal function globally for manual triggering
  window.openReportModal = openReportModal;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReportSystem);
  } else {
    initReportSystem();
  }

  // Re-add report button when question changes
  if (typeof window.state !== 'undefined') {
    const originalRenderQuestion = window.renderQuestion;
    if (originalRenderQuestion) {
      window.renderQuestion = function(...args) {
        const result = originalRenderQuestion.apply(this, args);
        // Add report button after a short delay to ensure DOM is updated
        setTimeout(addReportButtonToQuestion, 100);
        return result;
      };
    }
  }

})();
