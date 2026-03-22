
const { todayIST, yesterdayIST, utcToISTDate, startOfISTDay, endOfISTDay } = require('../server/src/utils/ist');

console.log('--- Current Implementation ---');
console.log('todayIST:', todayIST());
console.log('yesterdayIST:', yesterdayIST());
const now = new Date();
console.log('utcToISTDate(now):', utcToISTDate(now));
console.log('startOfISTDay(todayIST()):', startOfISTDay(todayIST()).toISOString());
console.log('endOfISTDay(todayIST()):', endOfISTDay(todayIST()).toISOString());

console.log('\n--- Proposed Implementation ---');
function todayIST_new() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
function yesterdayIST_new() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
console.log('todayIST_new:', todayIST_new());
console.log('yesterdayIST_new:', yesterdayIST_new());
