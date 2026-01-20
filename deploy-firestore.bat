@echo off
echo Deploying Firestore rules and indexes...
echo.

REM Deploy Firestore rules
firebase deploy --only firestore:rules

echo.
echo Deployment complete!
echo.
echo Note: Make sure you're logged in with 'firebase login' and have the correct project selected.
echo Check with 'firebase projects:list' and set with 'firebase use [project-id]'
pause
