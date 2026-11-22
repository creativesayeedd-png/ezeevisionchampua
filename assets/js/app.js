(function () {
  const statusPanel = document.querySelector('.status-panel');
  const statusTitle = document.getElementById('firebase-status');
  const statusDetail = document.getElementById('firebase-detail');
  const statusIcon = document.getElementById('status-icon');
  const year = document.getElementById('year');

  if (year) year.textContent = new Date().getFullYear();

  function setStatus(state, title, detail, icon) {
    if (statusPanel) statusPanel.dataset.state = state;
    if (statusTitle) statusTitle.textContent = title;
    if (statusDetail) statusDetail.textContent = detail;
    if (statusIcon) statusIcon.textContent = icon;
  }

  if (window.evcFirebase && window.evcFirebase.app) {
    setStatus(
      'ok',
      'Firebase SDK initialized',
      'Project configuration loaded for ' + window.evcFirebase.app.options.projectId + '. Authentication and database features will be added in the next development step.',
      '✓'
    );
  } else {
    setStatus(
      'error',
      'Firebase setup needs attention',
      'Check your internet connection and confirm that firebase-config.js is in the same folder as index.html.',
      '!'
    );
  }

  window.addEventListener('evc-firebase-ready', function () {
    if (window.evcFirebase && window.evcFirebase.app) {
      setStatus(
        'ok',
        'Firebase SDK initialized',
        'Project configuration loaded for ' + window.evcFirebase.app.options.projectId + '. Authentication and database features will be added in the next development step.',
        '✓'
      );
    }
  });
})();
