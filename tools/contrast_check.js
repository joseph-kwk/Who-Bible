#!/usr/bin/env node
// Contrast check for Who-Bible theme variables
// Usage: node tools/contrast_check.js
const fs = require('fs');
const path = require('path');

function hexToRgb(hex){
  if(!hex) return null;
  hex = hex.replace('#','');
  if(hex.length===3) hex = hex.split('').map(h=>h+h).join('');
  const n = parseInt(hex,16);
  return [(n>>16)&255, (n>>8)&255, n&255];
}

function luminance([r,g,b]){
  const a = [r,g,b].map(v=>{ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
}

function contrastRatio(rgbA, rgbB){
  const L1 = luminance(rgbA)+0.05;
  const L2 = luminance(rgbB)+0.05;
  return (Math.max(L1,L2)/Math.min(L1,L2));
}

function extractVars(themeBlock){
  const obj = {};
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while((m=re.exec(themeBlock))!==null){ obj[m[1].trim()] = m[2].trim(); }
  return obj;
}

const css = fs.readFileSync(path.join(__dirname,'..','assets','css','styles.css'),'utf8');

const themes = {
  root: {re:/:root\s*\{([\s\S]*?)\}/m},
  light: {re:/body\.light\s*\{([\s\S]*?)\}/m},
  sepia: {re:/body\.sepia\s*\{([\s\S]*?)\}/m},
  highContrast: {re:/body\.high-contrast\s*\{([\s\S]*?)\}/m}
};

const results = {};
for(const k of Object.keys(themes)){
  const m = css.match(themes[k].re);
  if(m) themes[k].vars = extractVars(m[1]); else themes[k].vars = {};
}

// mix root and theme vars
const base = themes.root.vars || {};
function merged(theme){ return {...base, ...(themes[theme==='root'? 'root': theme==='high-contrast'?'highContrast':theme].vars)}; }

function checkTheme(theme){
  const vars = merged(theme==='root'?'root':theme);
  const text = vars['text']||vars['text-primary']||'#000';
  const bg = vars['bg']||vars['bg-primary']||'#fff';
  const rgbText = hexToRgb(text.replace(/\s/g,''));
  const rgbBg = hexToRgb(bg.replace(/\s/g,''));
  if(!rgbText||!rgbBg){ return {ok:false, reason:'Missing color variables'}; }
  const ratio = contrastRatio(rgbText,rgbBg);
  return {ratio};
}

console.log('Contrast report (text vs background):');
for(const t of ['root','light','sepia','highContrast']){
  const key = t==='highContrast' ? 'high-contrast' : t;
  const res = checkTheme(t==='root'? 'root': (t==='highContrast'? 'high-contrast': t));
  if(res.ratio) console.log(`${key}: ${res.ratio.toFixed(2)}:1`);
}

console.log('\nNotes: Aim for 4.5:1 for normal text and 3:1 for large text.');
