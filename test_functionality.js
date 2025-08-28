// Simple test script to check Who-Bible functionality
// This script can be run in the browser console to test various functions

console.log("🧪 Testing Who-Bible Functionality");

// Test 1: Check if main elements exist
function testElementsExist() {
  console.log("\n1. Testing UI Elements...");
  const elements = [
    'setup-panel',
    'game-area', 
    'study-panel',
    'btn-solo',
    'btn-timed',
    'btn-challenge', 
    'btn-study',
    'btn-theme'
  ];
  
  elements.forEach(id => {
    const element = document.getElementById(id);
    console.log(`  ${id}: ${element ? '✅ Found' : '❌ Missing'}`);
  });
}

// Test 2: Check theme switching
function testThemeSwitching() {
  console.log("\n2. Testing Theme Switching...");
  const currentTheme = document.body.classList.contains('light') ? 'light' : 'dark';
  console.log(`  Current theme: ${currentTheme}`);
  
  // Toggle theme
  const themeBtn = document.getElementById('btn-theme');
  if (themeBtn) {
    themeBtn.click();
    const newTheme = document.body.classList.contains('light') ? 'light' : 'dark';
    console.log(`  After toggle: ${newTheme}`);
    console.log(`  Theme switching: ${currentTheme !== newTheme ? '✅ Working' : '❌ Not working'}`);
    
    // Toggle back
    themeBtn.click();
  } else {
    console.log("  ❌ Theme button not found");
  }
}

// Test 3: Check data loading
function testDataLoading() {
  console.log("\n3. Testing Data Loading...");
  if (typeof DEFAULT_PEOPLE_DATA !== 'undefined') {
    console.log(`  ✅ DEFAULT_PEOPLE_DATA loaded: ${DEFAULT_PEOPLE_DATA.length} people`);
    console.log(`  Sample: ${DEFAULT_PEOPLE_DATA[0]?.name || 'No data'}`);
  } else {
    console.log("  ❌ DEFAULT_PEOPLE_DATA not found");
  }
  
  if (typeof state !== 'undefined') {
    console.log(`  ✅ State object exists`);
    console.log(`  Current mode: ${state.mode}`);
    console.log(`  People loaded: ${state.people.length}`);
  } else {
    console.log("  ❌ State object not found");
  }
}

// Test 4: Check mode buttons work
function testModeButtons() {
  console.log("\n4. Testing Mode Buttons...");
  const modes = [
    { id: 'btn-solo', name: 'Solo Mode' },
    { id: 'btn-study', name: 'Study Mode' }
  ];
  
  modes.forEach(mode => {
    const btn = document.getElementById(mode.id);
    if (btn) {
      console.log(`  ${mode.name}: ✅ Button exists`);
      // Note: We won't actually click as it would change the UI state
    } else {
      console.log(`  ${mode.name}: ❌ Button missing`);
    }
  });
}

// Test 5: Check translation system
function testTranslations() {
  console.log("\n5. Testing Translation System...");
  if (typeof getText !== 'undefined') {
    const testKey = getText('soloMode') || getText('solo_mode') || 'Not found';
    console.log(`  ✅ Translation function exists`);
    console.log(`  Sample translation: ${testKey}`);
  } else {
    console.log("  ❌ Translation function not found");
  }
}

// Run all tests
function runAllTests() {
  testElementsExist();
  testThemeSwitching();
  testDataLoading();
  testModeButtons();
  testTranslations();
  console.log("\n🎉 Testing complete!");
}

// Auto-run tests if this script is executed
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    runAllTests();
  }
}
