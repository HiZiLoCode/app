const overrideParam = new URL(window.location.href).searchParams.get(
  'override_hid_check',
);
console.log(overrideParam,'overrideParam');

if (overrideParam !== null) {
  localStorage.setItem('override_hid_check', overrideParam);
}
const overrideHidCheck = localStorage.getItem('override_hid_check') || 'false';
export const OVERRIDE_HID_CHECK = !!JSON.parse(overrideHidCheck);
