import { UI } from './content.js';

// Strings added for the hosted (Supabase) version.
Object.assign(UI, {
  signInToJoin: { si: 'පන්තියට එක් වීමට ප්‍රජාව කොටසෙන් පුරනය වන්න.', en: 'Sign in from Community to join your class.' },
  joinClass: { si: 'ඔබේ පන්තියට එක් වන්න', en: 'Join your class' },
  joinHelp: { si: 'ඔබේ ඊමේල් ලිපිනයට පුරනය වීමේ සබැඳියක් එවනු ලැබේ. මුරපදයක් අවශ්‍ය නැත.', en: 'We’ll email you a sign-in link. No password needed.' },
  yourName: { si: 'ඔබේ නම', en: 'Your name' },
  email: { si: 'ඊමේල්', en: 'Email' },
  sendLink: { si: 'පුරනය වීමේ සබැඳිය එවන්න', en: 'Email me a sign-in link' },
  linkSent: { si: 'සබැඳිය එවන ලදී. ඔබේ ඊමේල් පරීක්ෂා කර එය මෙම උපාංගයේම විවෘත කරන්න.', en: 'Link sent. Check your email and open it on this device.' },
  linkErr: { si: 'සබැඳිය එවීමට නොහැකි විය. ලිපිනය පරීක්ෂා කර නැවත උත්සාහ කරන්න.', en: 'Couldn’t send the link. Check the address and try again.' },
  signOut: { si: 'ඉවත් වන්න', en: 'Sign out' },
  saveName: { si: 'සුරකින්න', en: 'Save' },
  noBackend: { si: 'මෙම ස්ථාපනයේ ප්‍රජා සේවාදායකය සකසා නැත.', en: 'The community server isn’t configured for this deployment.' },
  synced: { si: 'ඔබගේ ගිණුමට සුරැකේ', en: 'Saved to your account' },
  offline: { si: 'ප්‍රජා සේවාදායකය සකසා නැත.', en: 'The community server isn’t configured.' },
});

// Sign-in / sign-up and assignments (API version).
Object.assign(UI, {
  signInTab: { si: 'පුරනය වන්න', en: 'Sign in' },
  signUpTab: { si: 'ලියාපදිංචි වන්න', en: 'Sign up' },
  password: { si: 'මුරපදය', en: 'Password' },
  pwHelp: { si: 'අවම අක්ෂර 8ක්', en: 'At least 8 characters' },
  iAm: { si: 'මම', en: 'I am a' },
  roleStudent: { si: 'සිසුවෙක්', en: 'Student' },
  roleTeacher: { si: 'ගුරුවරයෙක්', en: 'Teacher' },
  teacherCode: { si: 'ගුරු කේතය', en: 'Teacher code' },
  teacherCodeHelp: { si: 'ඔබේ පාසලෙන් ලැබුණු ගුරු කේතය ඇතුළත් කරන්න.', en: 'Enter the teacher code from your school.' },
  createAcct: { si: 'ගිණුම සාදන්න', en: 'Create account' },
  signInBtn: { si: 'පුරනය වන්න', en: 'Sign in' },
  authHelp: { si: 'පැවරුම්, සාකච්ඡා සහ පන්ති ප්‍රතිඵල සඳහා පුරනය වන්න.', en: 'Sign in for assignments, discussion and class results.' },
  checkEmail: { si: 'ගිණුම සෑදුණි. ඔබේ ඊමේල් තහවුරු කර පසුව පුරනය වන්න.', en: 'Account created. Confirm your email, then sign in.' },
  wrongCode: { si: 'ගුරු කේතය වැරදියි.', en: 'That teacher code is not correct.' },
  badLogin: { si: 'ඊමේල් හෝ මුරපදය වැරදියි.', en: 'Email or password is incorrect.' },
  netErr: { si: 'සේවාදායකය හා සම්බන්ධ විය නොහැක.', en: 'Can’t reach the server.' },
  aTitle: { si: 'මාතෘකාව', en: 'Title' },
  aDesc: { si: 'උපදෙස් (විකල්ප)', en: 'Instructions (optional)' },
  aPrac: { si: 'ප්‍රායෝගිකය', en: 'Practical' },
  none: { si: 'කිසිවක් නැත', en: 'None' },
  publish: { si: 'පළ කරන්න', en: 'Publish' },
  enroll: { si: 'ලියාපදිංචි වන්න', en: 'Enroll' },
  leaveA: { si: 'ඉවත් වන්න', en: 'Leave' },
  markDone: { si: 'සම්පූර්ණ ලෙස සලකුණු කරන්න', en: 'Mark complete' },
  undoDone: { si: 'නැවත විවෘත කරන්න', en: 'Reopen' },
  doneNote: { si: 'ගුරුවරයාට සටහනක් (විකල්ප)', en: 'Note to your teacher (optional)' },
  stEnrolled: { si: 'ලියාපදිංචියි', en: 'Enrolled' },
  stCompleted: { si: 'සම්පූර්ණයි', en: 'Completed' },
  enrolledN: { si: 'ලියාපදිංචි', en: 'enrolled' },
  completedN: { si: 'සම්පූර්ණ', en: 'completed' },
  comments: { si: 'අදහස්', en: 'Comments' },
  commentPh: { si: 'අදහසක් ලියන්න…', en: 'Write a comment…' },
  send: { si: 'යවන්න', en: 'Send' },
  back: { si: 'ආපසු', en: 'Back' },
  details: { si: 'විස්තර', en: 'Details' },
  noComments: { si: 'තවම අදහස් නැත.', en: 'No comments yet.' },
  studentsList: { si: 'සිසුන්', en: 'Students' },
  noEnrolled: { si: 'තවම කිසිවෙකු ලියාපදිංචි වී නැත.', en: 'No students have enrolled yet.' },
  by: { si: 'පළ කළේ', en: 'by' },
});

Object.assign(UI, {
  signInToJoin: { si: 'පැවරුම් සහ සාකච්ඡා බැලීමට පුරනය වන්න.', en: 'Sign in to see assignments and discussion.' },
  signInTitle: { si: 'නැවත සාදරයෙන් පිළිගනිමු', en: 'Welcome back' },
  signUpTitle: { si: 'ගිණුමක් සාදන්න', en: 'Create your account' },
  noAcct: { si: 'ගිණුමක් නැද්ද?', en: 'No account yet?' },
  haveAcct: { si: 'දැනටමත් ගිණුමක් තිබේද?', en: 'Already have an account?' },
  serverSoon: { si: 'පුරනය වීමේ සේවාදායකය තවම සකසමින් පවතී. ටික වේලාවකින් නැවත උත්සාහ කරන්න.', en: 'Sign-in isn’t available yet: the server is still being set up. Please try again soon.' },
  emailTaken: { si: 'මෙම ඊමේල් සමඟ ගිණුමක් දැනටමත් ඇත. පුරනය වන්න.', en: 'An account with this email already exists. Sign in instead.' },
  tooMany: { si: 'උත්සාහයන් වැඩියි. මිනිත්තු කිහිපයකින් නැවත උත්සාහ කරන්න.', en: 'Too many attempts. Try again in a few minutes.' },
});

Object.assign(UI, {
  colStatus: { si: 'තත්ත්වය', en: 'Status' },
  colNote: { si: 'සටහන', en: 'Note' },
});

// Forgotten password
Object.assign(UI, {
  forgotLink: { si: 'මුරපදය අමතකද?', en: 'Forgot password?' },
  forgotTitle: { si: 'මුරපදය යළි සකසන්න', en: 'Reset your password' },
  forgotHelp: { si: 'ඔබේ ගිණුමේ ඊමේල් ලිපිනය ඇතුළත් කරන්න. නව මුරපදයක් සැකසීමට සබැඳියක් එවනු ලැබේ.', en: 'Enter your account’s email. We’ll send you a link to set a new password.' },
  sendReset: { si: 'සබැඳිය එවන්න', en: 'Send reset link' },
  resetSent: { si: 'එම ඊමේල් සමඟ ගිණුමක් ඇත්නම්, සබැඳියක් එවා ඇත. ඔබේ ඊමේල් (සහ Spam ෆෝල්ඩරය) පරීක්ෂා කරන්න.', en: 'If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).' },
  resetTitle: { si: 'නව මුරපදයක් සකසන්න', en: 'Set a new password' },
  resetHelp: { si: 'ඔබේ ගිණුම සඳහා නව මුරපදයක් තෝරන්න.', en: 'Choose a new password for your account.' },
  newPw: { si: 'නව මුරපදය', en: 'New password' },
  newPw2: { si: 'නව මුරපදය නැවත', en: 'Repeat new password' },
  savePw: { si: 'මුරපදය සුරකින්න', en: 'Save password' },
  pwMismatch: { si: 'මුරපද දෙක නොගැළපේ.', en: 'The two passwords don’t match.' },
  samePw: { si: 'පැරණි මුරපදයට වඩා වෙනස් මුරපදයක් තෝරන්න.', en: 'Choose a password different from your old one.' },
  linkExpired: { si: 'මෙම සබැඳිය කල් ඉකුත් වී ඇත හෝ දැනටමත් භාවිතා කර ඇත. නව සබැඳියක් ඉල්ලන්න.', en: 'This link has expired or was already used. Request a new one.' },
  backToSignIn: { si: 'පුරනය වීමට ආපසු', en: 'Back to sign in' },
});

Object.assign(UI, {
  showLabels: { si: 'කොටස්වල නම් පෙන්වන්න', en: 'Show part labels' },
  hideLabels: { si: 'කොටස්වල නම් සඟවන්න', en: 'Hide part labels' },
});

Object.assign(UI, {
  resizePanel: { si: 'ත්‍රිමාණ පුවරුවේ පළල වෙනස් කරන්න (අදින්න)', en: 'Drag to resize the 3D panel' },
});

// Account menu, profile, loading
Object.assign(UI, {
  profile: { si: 'පැතිකඩ', en: 'Profile' },
  account: { si: 'ගිණුම', en: 'Account' },
  close: { si: 'වසන්න', en: 'Close' },
  notSignedIn: { si: 'පුරනය වී නැත', en: 'Not signed in' },
  profileSaved: { si: 'සුරකින ලදී.', en: 'Saved.' },
  loading: { si: 'රැඳී සිටින්න…', en: 'Please wait…' },
  stillWorking: { si: 'තවමත් ක්‍රියාත්මකයි. සම්බන්ධතාවය මන්දගාමී විය හැක.', en: 'Still working. The connection may be slow.' },
});

Object.assign(UI, {
  searchPrac: { si: 'සොයන්න (English): උදා. vernier, 12', en: 'Search practicals, e.g. vernier, 12' },
  noMatches: { si: 'ගැළපෙන දේ නැත', en: 'No matches' },
});

Object.assign(UI, { findPrac: { si: 'පරීක්ෂණයක් සොයන්න', en: 'Find a practical' } });

// Profile page
Object.assign(UI, {
  pfMyProfile: { si: 'මගේ පැතිකඩ', en: 'My profile' },
  editName: { si: 'නම වෙනස් කරන්න', en: 'Edit name' },
  pfSignedOut: { si: 'ඔබේ ප්‍රගතිය මෙම උපාංගයේ සුරැකේ. පැවරුම් සහ දැනුම්දීම් සඳහා පුරනය වන්න.', en: 'Your practical progress is saved on this device. Sign in for assignments and notifications.' },
  pfSummary: { si: 'සාරාංශය', en: 'Summary' },
  pfPracDone: { si: 'අවසන් කළ පරීක්ෂණ', en: 'Practicals done' },
  pfInProgress: { si: 'ක්‍රියාත්මකයි', en: 'in progress' },
  pfAsgDone: { si: 'අවසන් කළ පැවරුම්', en: 'Assignments done' },
  pfAsgPending: { si: 'ඉතිරි පැවරුම්', en: 'Pending' },
  pfEnrolledNotDone: { si: 'ලියාපදිංචියි, තවම අවසන් නැත', en: 'enrolled, not finished' },
  pfAsgOpen: { si: 'නව පැවරුම්', en: 'Open to join' },
  pfNotEnrolled: { si: 'තවම ලියාපදිංචි නැත', en: 'not enrolled yet' },
  pfPublished: { si: 'පළ කළ පැවරුම්', en: 'Published' },
  pfEnrolments: { si: 'ලියාපදිංචි වීම්', en: 'Enrolments' },
  pfAcross: { si: 'ඔබේ සියලු පැවරුම්වල', en: 'across your assignments' },
  pfCompletions: { si: 'අවසන් කිරීම්', en: 'Completions' },
  pfAwaiting: { si: 'බලාපොරොත්තුවෙන්', en: 'still working' },
  pfNotif: { si: 'දැනුම්දීම්', en: 'Notifications' },
  pfUnread: { si: 'නොකියවූ', en: 'unread' },
  pfMarkRead: { si: 'සියල්ල කියවූ ලෙස සලකුණු කරන්න', en: 'Mark all read' },
  pfNoNotif: { si: 'තවම දැනුම්දීම් නැත.', en: 'No notifications yet.' },
  nReplied: { si: 'ඔබේ පළ කිරීමට පිළිතුරු දුන්නා:', en: 'replied to your post' },
  nDue: { si: 'ඉක්මනින් නියමිතයි:', en: 'Due soon:' },
  nNew: { si: 'නව පැවරුම:', en: 'New assignment:' },
  nCompleted: { si: 'සිසුන් අවසන් කළා:', en: 'students completed' },
  pfMyPrac: { si: 'මගේ පරීක්ෂණ', en: 'My practicals' },
  pfOpen: { si: 'විවෘතයි', en: 'Open' },
  pfResponses: { si: 'මගේ පළ කිරීම්වලට පිළිතුරු', en: 'Responses to my posts' },
  pfNoPosts: { si: 'ඔබ තවම කිසිවක් පළ කර නැත.', en: 'You haven’t posted yet.' },
  pfReplies: { si: 'පිළිතුරු', en: 'replies' },
  pfClass: { si: 'මගේ පන්තිය', en: 'My class' },
  pfClassAsg: { si: 'පන්තියේ පැවරුම්', en: 'class assignments' },
  pfClassPosts: { si: 'සාකච්ඡා', en: 'discussions' },
  pfClassMembers: { si: 'ක්‍රියාකාරී සාමාජිකයන්', en: 'active members' },
});

Object.assign(UI, { dueToday: { si: 'අද නියමිතයි', en: 'Due today' } });

Object.assign(UI, { pfReply: { si: 'පිළිතුර', en: 'reply' } });

Object.assign(UI, {
  theme: { si: 'තේමාව', en: 'Theme', ta: 'தோற்றம்' },
  themeLight: { si: 'ආලෝක', en: 'Light', ta: 'ஒளி' },
  themeDark: { si: 'අඳුරු', en: 'Dark', ta: 'இருள்' },
  themeAuto: { si: 'උපාංගය අනුව', en: 'Match device', ta: 'சாதனத்தைப் பின்பற்று' },
});
