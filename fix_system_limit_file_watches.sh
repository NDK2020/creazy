## remember to make this file executable
## sudo chmod +x fix_system_limit_file_watches.sh
sudo sysctl fs.inotify.max_user_watches=131070
sudo sysctl -p
