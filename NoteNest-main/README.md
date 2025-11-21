# NoteNest
NoteNest is a simple, web-based study tool that helps students organize notes and turn them into digital flashcards. It’s designed to make studying easier, more interactive, and accessible anywhere, keeping all learning materials in one neat and organized place.

11/11/2025 ADDED:
Login feature using Firebase, (use "devuser@twu.edu  &  dev0nly" for a temp student login ||  "dransom2@twu.edu  &  123456" for admin login),
extracted login functions from test.html and injected into login.html
redirects from login to temporary admin or student pages respectively

TODO: Add logout feature,
 add sign up feature (ask if student or teacher login), X
 divide the rest of 'test.html' into seperate .html files for readability, X
 convert .txt to .JSON for server side storage, ?
 and more..


11/14/25



TODO:
need to ensure users are logged in to Firebase Auth before accessing quizzes, as well as securely save their scores. X
add Firebase Firestore rules to ensure only authenticated users can read/write data to the database. X


11/19/25

TODO: Ensure users cant overwrite already created test, by either providing a uniqueID or unique test names only.
    Fix redirect when logging out of quiz_creator.html  X
    Redirect to login.html if user is not logged in (only needed on student_homepage.html as of rn) X
    Add sign-up redirect from login X
    Ask if teacher/student on signup
    Scrub older files to assure they match the changed logic from todays code
    Change /login to /webHelper or something more understandable