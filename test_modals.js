// Test script to check modal functionality
console.log("🧪 Testing Modal Functionality");

function testModalElements() {
  console.log("\n1. Testing Modal Elements...");
  
  // Check if modal elements exist
  const elements = {
    'playersModal': document.getElementById('players-modal'),
    'btnChallenge': document.getElementById('btn-challenge'),
    'btnPlayersClose': document.getElementById('btn-players-close'),
    'btnPlayersCancel': document.getElementById('btn-players-cancel'),
    'btnPlayersStart': document.getElementById('btn-players-start'),
    'p1NameInput': document.getElementById('p1-name-input') || document.getElementById('p1-name'),
    'p2NameInput': document.getElementById('p2-name-input') || document.getElementById('p2-name')
  };
  
  Object.entries(elements).forEach(([name, element]) => {
    console.log(`  ${name}: ${element ? '✅ Found' : '❌ Missing'}`);
  });
  
  return elements;
}

function testModalFunctions() {
  console.log("\n2. Testing Modal Functions...");
  
  // Check if functions exist
  const functions = [
    'showPlayersModal',
    'hidePlayersModal',
    'startChallenge',
    'startChallengeFromModal'
  ];
  
  functions.forEach(funcName => {
    const exists = typeof window[funcName] === 'function';
    console.log(`  ${funcName}: ${exists ? '✅ Found' : '❌ Missing'}`);
  });
}

function testModalDisplay() {
  console.log("\n3. Testing Modal Display...");
  
  const modal = document.getElementById('players-modal');
  if (modal) {
    const currentDisplay = window.getComputedStyle(modal).display;
    console.log(`  Modal current display: ${currentDisplay}`);
    
    // Test showing modal
    if (typeof showPlayersModal === 'function') {
      console.log("  Testing showPlayersModal...");
      showPlayersModal();
      const newDisplay = window.getComputedStyle(modal).display;
      console.log(`  Modal display after show: ${newDisplay}`);
      
      // Test hiding modal
      if (typeof hidePlayersModal === 'function') {
        setTimeout(() => {
          console.log("  Testing hidePlayersModal...");
          hidePlayersModal();
          const hiddenDisplay = window.getComputedStyle(modal).display;
          console.log(`  Modal display after hide: ${hiddenDisplay}`);
        }, 1000);
      }
    } else {
      console.log("  ❌ showPlayersModal function not found");
    }
  } else {
    console.log("  ❌ Players modal element not found");
  }
}

function testChallengeButton() {
  console.log("\n4. Testing Challenge Button...");
  
  const challengeBtn = document.getElementById('btn-challenge');
  if (challengeBtn) {
    console.log("  ✅ Challenge button found");
    
    // Check if event listener is attached
    const events = getEventListeners ? getEventListeners(challengeBtn) : 'Cannot check events';
    console.log("  Event listeners:", events);
    
    // Test clicking the button programmatically
    console.log("  Testing button click...");
    challengeBtn.click();
    
    // Check if modal appeared
    setTimeout(() => {
      const modal = document.getElementById('players-modal');
      if (modal) {
        const display = window.getComputedStyle(modal).display;
        console.log(`  Modal display after button click: ${display}`);
        console.log(`  Modal working: ${display !== 'none' ? '✅ Yes' : '❌ No'}`);
        
        // Hide modal after test
        if (display !== 'none' && typeof hidePlayersModal === 'function') {
          setTimeout(() => hidePlayersModal(), 1000);
        }
      }
    }, 500);
  } else {
    console.log("  ❌ Challenge button not found");
  }
}

// Run all tests
function runModalTests() {
  const elements = testModalElements();
  testModalFunctions();
  testModalDisplay();
  testChallengeButton();
  
  console.log("\n🎉 Modal testing complete!");
  return elements;
}

// Auto-run tests when script loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runModalTests);
  } else {
    runModalTests();
  }
}
