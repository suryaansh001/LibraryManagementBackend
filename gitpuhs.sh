git init
git add .
read -p "Enter commit message: " commit_message
if [ -z "$commit_message" ]; then
  commit_message="Initial commit"
fi
git commit -m "$commit_message"
git push
